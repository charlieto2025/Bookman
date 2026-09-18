import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod/v4";
import type { CanonEntryType } from "@/generated/prisma/client";

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

function formatExistingEntries(entries: ExistingEntry[]): string {
  if (entries.length === 0) return "(story bible is currently empty)";
  return entries
    .map((e) => `[${e.type}] ${e.name}\n${e.content}`)
    .join("\n\n---\n\n");
}

const EXTRACTION_SYSTEM_PROMPT = `你是一位小说创作助手，负责维护作者的故事设定集（人物、世界观、时间线等）。
你会收到一份"当前设定集"和一段"新文本"（可能是作者上传的设定文档，也可能是刚写完的一章正文）。
请仔细比对，找出新文本中包含的、但设定集里还没有或需要更新的信息，输出为一组结构化的变更提案。

规则：
- 每条提案的 content 字段必须是该设定条目完整、独立可读的文本，而不是简短摘要或增量描述。
- 如果新文本提到的人物/设定已存在于当前设定集中（entryName 完全匹配），使用 changeType="UPDATE"，content 应包含原有信息加上新增/变化的部分。
- 如果是全新的人物/地点/设定，使用 changeType="CREATE"。
- 不要重复输出未发生变化的条目。
- 不要翻译或改写原文风格，保留作者原本的中文表达。
- 如果新文本中没有值得记录的新设定信息，返回空的 proposals 数组。`;

export async function extractCanonProposals(params: {
  sourceText: string;
  sourceLabel: string;
  existingEntries: ExistingEntry[];
}): Promise<CanonProposal[]> {
  const response = await getClient().responses.parse({
    model: MODEL,
    instructions: EXTRACTION_SYSTEM_PROMPT,
    input: `当前设定集：\n\n${formatExistingEntries(params.existingEntries)}\n\n---\n\n新文本（来源：${params.sourceLabel}）：\n\n${params.sourceText}`,
    text: { format: zodTextFormat(CanonProposalSchema, "canon_proposals") },
  });

  if (!response.output_parsed) return [];
  return response.output_parsed.proposals;
}

export type DraftMode = "predict_next" | "character_what_if" | "draft_chapter";

const DRAFT_SYSTEM_PROMPTS: Record<DraftMode, string> = {
  predict_next: `你是一位小说创作助手。根据作者提供的故事设定（人物、世界观、时间线）与最近章节内容，推测接下来最可能发生的情节发展。
你的推测必须与已有设定保持一致，不能杜撰与设定矛盾的信息。可以给出一到两种合理的发展方向，并简要说明理由。这是给作者参考的推演，不是正式章节正文。`,
  character_what_if: `你是一位小说创作助手。作者会指定故事中的某个人物和一个具体情境，请你基于该人物已建立的性格、动机与过往经历，推演这个人物在该情境下最可能的言行反应。
推演应当忠于角色逻辑，即使结果出人意料也要能从其设定中找到依据。明确说明这只是一次假设性推演，不代表故事正典发展。`,
  draft_chapter: `你是一位小说创作助手，为作者代笔撰写章节正文。请严格依据提供的故事设定（人物、世界观、时间线）与前情章节，保持人物性格、语气与文风的一致性，撰写完整的章节内容。
输出应为可直接使用的正文文字，不需要额外的解释或提纲，除非作者特别要求。`,
};

export async function streamDraft(params: {
  mode: DraftMode;
  canonContext: string;
  recentChapters: string;
  instructions: string;
}) {
  const contextParts = [
    `【故事设定】\n${params.canonContext || "（暂无设定）"}`,
    `【最近章节内容】\n${params.recentChapters || "（暂无已写章节）"}`,
    `【作者的要求】\n${params.instructions}`,
  ];

  return getClient().responses.create({
    model: MODEL,
    instructions: DRAFT_SYSTEM_PROMPTS[params.mode],
    input: contextParts.join("\n\n"),
    stream: true,
  });
}
