"use client";

import { useState } from "react";

const MODES = [
  { value: "predict_next", label: "预测接下来会发生什么" },
  { value: "character_what_if", label: "推演某个人物在特定情境下的行为" },
  { value: "draft_chapter", label: "代笔撰写下一章" },
] as const;

type Mode = (typeof MODES)[number]["value"];

export function DraftClient({ projectId }: { projectId: string }) {
  const [mode, setMode] = useState<Mode>("predict_next");
  const [instructions, setInstructions] = useState("");
  const [output, setOutput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!instructions.trim() || isStreaming) return;

    setOutput("");
    setError(null);
    setCopied(false);
    setIsStreaming(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, instructions }),
      });

      if (!res.ok || !res.body) {
        throw new Error(await res.text());
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <label key={m.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              {m.label}
            </label>
          ))}
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="描述你的具体要求，例如：主角在得知真相后会怎么做？"
          required
          rows={4}
          className="rounded border border-zinc-300 px-3 py-2 font-serif"
        />
        <button
          type="submit"
          disabled={isStreaming}
          className="self-start rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isStreaming ? "生成中…" : "生成"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(output || isStreaming) && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">生成结果</h2>
            {output && (
              <button onClick={handleCopy} className="text-sm text-zinc-500 hover:underline">
                {copied ? "已复制" : "复制文本"}
              </button>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap font-serif leading-relaxed">
            {output}
            {isStreaming && <span className="animate-pulse">▍</span>}
          </p>
        </div>
      )}
    </div>
  );
}
