import type { CanonEntryType } from "@/generated/prisma/client";

// This module must stay free of server-only imports (e.g. "next/headers") -
// Client Components (ProjectSidebar, DraftClient) import plain helpers from
// here directly, and any server-only import at module scope would get
// bundled into the client and crash at build time. Locale-reading lives in
// i18n-server.ts instead.

export type Locale = "zh" | "en";

/** Fills `{key}` placeholders in a dictionary string. Safe to import into Client Components. */
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);
}

export function chapterOrdinal(index: number, locale: Locale): string {
  return locale === "zh" ? `第 ${index} 章` : `Chapter ${index}`;
}

export function chapterCountLabel(n: number, locale: Locale): string {
  return locale === "zh" ? `共 ${n} 章` : `${n} chapter${n === 1 ? "" : "s"}`;
}

export function canonCountLabel(n: number, locale: Locale): string {
  return locale === "zh" ? `共 ${n} 條` : `${n} ${n === 1 ? "entry" : "entries"}`;
}

export const canonTypeLabels: Record<Locale, Record<CanonEntryType, string>> = {
  zh: { CHARACTER: "人物", WORLD: "世界觀", TIMELINE: "時間線", OTHER: "其他" },
  en: { CHARACTER: "Character", WORLD: "World", TIMELINE: "Timeline", OTHER: "Other" },
};

export const projectLanguageLabels: Record<Locale, { zh: string; en: string }> = {
  zh: { zh: "繁體中文", en: "English" },
  en: { zh: "Traditional Chinese", en: "English" },
};

const dict = {
  zh: {
    nav: { allProjects: "← 所有作品" },
    home: {
      title: "我的作品",
      empty: "還沒有作品，先在下面建立一個吧。",
      newProjectTitle: "新建作品",
      titlePlaceholder: "作品名稱",
      create: "建立",
    },
    dashboard: {
      write: "寫作 / 預測",
      writeDesc: "續寫下一步、人物推演、代筆章節",
      canon: "故事設定",
      chapters: "章節記錄",
      upload: "上傳設定文件",
      uploadDesc: "上傳 .docx 文件",
      diffs: "待審核的設定變更",
      diffsPending: "{n} 條待審核",
      diffsEmpty: "暫無待審核",
    },
    sidebar: {
      chaptersHeader: "章節 {n}",
      all: "全部",
      noChapters: "還沒有章節",
    },
    canon: {
      title: "故事設定集",
      save: "儲存修改",
      delete: "刪除該條目",
      addTitle: "手動新增設定條目",
      namePlaceholder: "名稱",
      contentPlaceholder: "詳細內容",
      add: "新增",
    },
    diffs: {
      title: "待審核的設定變更",
      empty: "目前沒有待審核的變更。",
      typeCreate: "新增條目",
      typeUpdate: "更新條目",
      sourceUpload: "來自上傳文件",
      sourceChapter: "來自新章節",
      sourceManual: "手動新增",
      chapterRef: "· {chapter}：{title}",
      rationaleLabel: "理由：{reason}",
      approve: "採納",
      reject: "忽略",
    },
    upload: {
      title: "上傳設定文件",
      desc: "上傳包含故事背景、人物設定等資訊的 Word 文件（.docx）。系統會自動擷取其中的設定資訊，產生變更提案供你審核後再正式加入設定集。",
      button: "上傳並擷取設定",
      note: "處理可能需要一些時間，取決於文件長度，請耐心等待頁面跳轉。",
    },
    draft: {
      title: "寫作 / 預測",
      desc: "生成的內容僅供參考，請自行複製到你的手稿中；本工具不會自動儲存到章節記錄。",
      modePredictNext: "預測接下來會發生什麼",
      modeCharacterWhatIf: "推演某個人物在特定情境下的行為",
      modeDraftChapter: "代筆撰寫下一章",
      placeholder: "描述你的具體要求，例如：主角在得知真相後會怎麼做？",
      generate: "生成",
      generating: "生成中…",
      result: "生成結果",
      copy: "複製文本",
      copied: "已複製",
      genericError: "生成失敗，請重試",
    },
    chapters: {
      title: "章節記錄",
      desc: "在這裡儲存你最終確定的章節正文（寫作/預測頁只是草稿，請把你實際採用並修改好的版本貼到此處）。儲存後系統會自動比對設定集，提出可能需要更新的人物 / 世界觀 / 時間線資訊供你審核。",
      saveNewTitle: "儲存新章節（{chapter}）",
      titlePlaceholder: "章節標題",
      contentPlaceholder: "章節正文",
      save: "儲存章節",
    },
    chapterDetail: {
      edit: "編輯",
      editing: "編輯{chapter}",
      save: "儲存",
      cancel: "取消",
    },
  },
  en: {
    nav: { allProjects: "← All Projects" },
    home: {
      title: "My Projects",
      empty: "You don't have any projects yet — create one below.",
      newProjectTitle: "New Project",
      titlePlaceholder: "Project title",
      create: "Create",
    },
    dashboard: {
      write: "Write / Predict",
      writeDesc: "Continue the story, explore a character, or draft a chapter",
      canon: "Story Bible",
      chapters: "Chapters",
      upload: "Upload Story Bible",
      uploadDesc: "Upload a .docx file",
      diffs: "Pending Canon Changes",
      diffsPending: "{n} pending",
      diffsEmpty: "Nothing pending",
    },
    sidebar: {
      chaptersHeader: "Chapters {n}",
      all: "All",
      noChapters: "No chapters yet",
    },
    canon: {
      title: "Story Bible",
      save: "Save Changes",
      delete: "Delete Entry",
      addTitle: "Add Entry Manually",
      namePlaceholder: "Name",
      contentPlaceholder: "Details",
      add: "Add",
    },
    diffs: {
      title: "Pending Canon Changes",
      empty: "No pending changes right now.",
      typeCreate: "New entry",
      typeUpdate: "Updated entry",
      sourceUpload: "From upload",
      sourceChapter: "From new chapter",
      sourceManual: "Manually added",
      chapterRef: "· {chapter}: {title}",
      rationaleLabel: "Reason: {reason}",
      approve: "Approve",
      reject: "Ignore",
    },
    upload: {
      title: "Upload Story Bible",
      desc: "Upload a Word document (.docx) with your story background, characters, and other setting info. The system will automatically extract proposed canon entries for you to review before anything is added.",
      button: "Upload & Extract",
      note: "Processing may take a moment depending on document length — please wait for the page to redirect.",
    },
    draft: {
      title: "Write / Predict",
      desc: "Generated text is for reference only — copy what you want into your manuscript yourself; this tool doesn't save anything to your chapters automatically.",
      modePredictNext: "Predict what happens next",
      modeCharacterWhatIf: "Explore how a character would act",
      modeDraftChapter: "Draft the next chapter",
      placeholder: "Describe what you want, e.g. What does the protagonist do after learning the truth?",
      generate: "Generate",
      generating: "Generating…",
      result: "Result",
      copy: "Copy text",
      copied: "Copied",
      genericError: "Generation failed — please try again.",
    },
    chapters: {
      title: "Chapters",
      desc: "Save the final text of chapters you've written here (the Write/Predict page only produces drafts — paste in the version you actually used and edited). Saving re-checks your story bible and proposes any character / world / timeline updates for you to review.",
      saveNewTitle: "Save New Chapter ({chapter})",
      titlePlaceholder: "Chapter title",
      contentPlaceholder: "Chapter text",
      save: "Save Chapter",
    },
    chapterDetail: {
      edit: "Edit",
      editing: "Editing {chapter}",
      save: "Save",
      cancel: "Cancel",
    },
  },
} satisfies Record<Locale, unknown>;

export type Dictionary = (typeof dict)["zh"];

export function dictFor(locale: Locale): Dictionary {
  return dict[locale];
}
