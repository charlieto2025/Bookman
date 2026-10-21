import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod/v4";
import type { CanonEntryType } from "@/generated/prisma/client";
import type { Locale } from "@/lib/i18n";

// Constructed lazily (not at module load) because the OpenAI SDK throws
// immediately if OPENAI_API_KEY is unset - eager construction would crash
// every page that imports this module, not just the AI-feature ones.
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

const MODEL = "gpt-5.5";

const CANON_CATEGORIES = ["CHARACTER", "WORLD", "TIMELINE", "OTHER"] as const;

const CanonProposalSchema = z.object({
  proposals: z.array(
    z.object({
      changeType: z.enum(["CREATE", "UPDATE"]),
      category: z.enum(CANON_CATEGORIES),
      entryName: z
        .string()
        .describe(
          "For UPDATE this must exactly match an existing entry's name. For CREATE this is the new entry's name.",
        ),
      content: z
        .string()
        .describe(
          "The full proposed entry text (not a diff) - for UPDATE, the complete updated version of the entry.",
        ),
      rationale: z
        .string()
        .describe("One sentence explaining why this change is proposed, shown to the author during review."),
    }),
  ),
});

export type CanonProposal = z.infer<typeof CanonProposalSchema>["proposals"][number];

type ExistingEntry = { type: CanonEntryType; name: string; content: string };

function formatExistingEntries(entries: ExistingEntry[], locale: Locale): string {
  if (entries.length === 0) return locale === "zh" ? "（目前設定集是空的）" : "(story bible is currently empty)";
  return entries.map((e) => `[${e.type}] ${e.name}\n${e.content}`).join("\n\n---\n\n");
}

const EXTRACTION_SYSTEM_PROMPTS: Record<Locale, string> = {
  zh: `你是一位小說創作助手，負責維護作者的故事設定集（人物、世界觀、時間線等）。
你會收到一份「目前設定集」和一段「新文本」（可能是作者上傳的設定文件，也可能是剛寫完的一章正文）。
請仔細比對，找出新文本中包含的、但設定集裡還沒有或需要更新的資訊，輸出為一組結構化的變更提案。

規則：
- 每條提案的 content 欄位必須是該設定條目完整、獨立可讀的文字，而不是簡短摘要或增量描述。
- 如果新文本提到的人物/設定已存在於目前設定集中（entryName 完全符合），使用 changeType="UPDATE"，content 應包含原有資訊加上新增/變化的部分。
- 如果是全新的人物/地點/設定，使用 changeType="CREATE"。
- 不要重複輸出未發生變化的條目。
- 不要翻譯或改寫原文風格，保留作者原本的表達方式。
- 如果新文本中沒有值得記錄的新設定資訊，返回空的 proposals 陣列。`,
  en: `You are a novel-writing assistant responsible for maintaining the author's story bible (characters, world/setting, timeline, etc.).
You will receive the "current story bible" and a "new text" (which may be a setting document the author uploaded, or a chapter they just finished writing).
Carefully compare the two, find information in the new text that isn't yet in the story bible or needs updating, and output it as a set of structured change proposals.

Rules:
- Each proposal's content field must be the complete, standalone text of that entry - not a short summary or incremental description.
- If the new text refers to a character/setting that already exists in the current story bible (entryName matches exactly), use changeType="UPDATE", and content should include the original info plus what's new/changed.
- If it's an entirely new character/place/setting, use changeType="CREATE".
- Don't re-output entries that haven't changed.
- Don't translate or rewrite the author's style - preserve their original wording.
- If there's nothing worth recording in the new text, return an empty proposals array.`,
};

export async function extractCanonProposals(params: {
  sourceText: string;
  sourceLabel: string;
  existingEntries: ExistingEntry[];
  language: Locale;
}): Promise<CanonProposal[]> {
  const { language } = params;
  const sourceLine =
    language === "zh"
      ? `新文本（來源：${params.sourceLabel}）：`
      : `New text (source: ${params.sourceLabel}):`;
  const currentLine = language === "zh" ? "目前設定集：" : "Current story bible:";

  const response = await getClient().responses.parse({
    model: MODEL,
    instructions: EXTRACTION_SYSTEM_PROMPTS[language],
    input: `${currentLine}\n\n${formatExistingEntries(params.existingEntries, language)}\n\n---\n\n${sourceLine}\n\n${params.sourceText}`,
    text: { format: zodTextFormat(CanonProposalSchema, "canon_proposals") },
  });

  if (!response.output_parsed) return [];
  return response.output_parsed.proposals;
}

export type DraftMode = "predict_next" | "character_what_if" | "draft_chapter";

const DRAFT_SYSTEM_PROMPTS: Record<Locale, Record<DraftMode, string>> = {
  zh: {
    predict_next: `你是一位小說創作助手。根據作者提供的故事設定（人物、世界觀、時間線）與最近章節內容，推測接下來最可能發生的情節發展。
你的推測必須與已有設定保持一致，不能杜撰與設定矛盾的資訊。可以給出一到兩種合理的發展方向，並簡要說明理由。這是給作者參考的推演，不是正式章節正文。`,
    character_what_if: `你是一位小說創作助手。作者會指定故事中的某個人物和一個具體情境，請你基於該人物已建立的性格、動機與過往經歷，推演這個人物在該情境下最可能的言行反應。
推演應當忠於角色邏輯，即使結果出人意料也要能從其設定中找到依據。明確說明這只是一次假設性推演，不代表故事正典發展。`,
    draft_chapter: `你是一位小說創作助手，為作者代筆撰寫章節正文。請嚴格依據提供的故事設定（人物、世界觀、時間線）與前情章節，保持人物性格、語氣與文風的一致性，撰寫完整的章節內容。
輸出應為可直接使用的正文文字，不需要額外的解釋或提綱，除非作者特別要求。`,
  },
  en: {
    predict_next: `You are a novel-writing assistant. Based on the author's story bible (characters, world/setting, timeline) and the most recent chapters, predict what is most likely to happen next.
Your prediction must stay consistent with the established setting - don't invent anything that contradicts it. You may offer one or two plausible directions with brief reasoning. This is a reference prediction for the author, not finished chapter prose.`,
    character_what_if: `You are a novel-writing assistant. The author will specify a character and a specific situation; based on that character's established personality, motivations, and history, work out how they would most plausibly act and speak in that situation.
The reasoning should stay true to the character's internal logic, even if the outcome is surprising - it should still be traceable to their established traits. Make clear this is a hypothetical exploration, not canon.`,
    draft_chapter: `You are a novel-writing assistant ghostwriting a chapter for the author. Strictly follow the provided story bible (characters, world/setting, timeline) and prior chapters, keeping characters' personalities, tone, and prose style consistent, and write the complete chapter text.
The output should be usable prose as-is, without extra explanation or an outline, unless the author specifically asked for one.`,
  },
};

export async function streamDraft(params: {
  mode: DraftMode;
  canonContext: string;
  recentChapters: string;
  instructions: string;
  language: Locale;
}) {
  const { language } = params;
  const labels =
    language === "zh"
      ? {
          canon: "【故事設定】",
          canonEmpty: "（暫無設定）",
          chapters: "【最近章節內容】",
          chaptersEmpty: "（暫無已寫章節）",
          request: "【作者的要求】",
        }
      : {
          canon: "[Story Bible]",
          canonEmpty: "(no story bible yet)",
          chapters: "[Recent Chapters]",
          chaptersEmpty: "(no chapters written yet)",
          request: "[Author's Request]",
        };

  const contextParts = [
    `${labels.canon}\n${params.canonContext || labels.canonEmpty}`,
    `${labels.chapters}\n${params.recentChapters || labels.chaptersEmpty}`,
    `${labels.request}\n${params.instructions}`,
  ];

  return getClient().responses.create({
    model: MODEL,
    instructions: DRAFT_SYSTEM_PROMPTS[language][params.mode],
    input: contextParts.join("\n\n"),
    stream: true,
  });
}
