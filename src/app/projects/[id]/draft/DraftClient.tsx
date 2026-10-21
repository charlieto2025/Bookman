"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Mode = "predict_next" | "character_what_if" | "draft_chapter";

export function DraftClient({ projectId, dict }: { projectId: string; dict: Dictionary["draft"] }) {
  const MODES: { value: Mode; label: string }[] = [
    { value: "predict_next", label: dict.modePredictNext },
    { value: "character_what_if", label: dict.modeCharacterWhatIf },
    { value: "draft_chapter", label: dict.modeDraftChapter },
  ];

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
      setError(err instanceof Error ? err.message : dict.genericError);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-900/5">
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
          placeholder={dict.placeholder}
          required
          rows={4}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-serif"
        />
        <button
          type="submit"
          disabled={isStreaming}
          className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {isStreaming ? dict.generating : dict.generate}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(output || isStreaming) && (
        <div className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-900/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{dict.result}</h2>
            {output && (
              <button onClick={handleCopy} className="text-sm text-zinc-500 hover:underline">
                {copied ? dict.copied : dict.copy}
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
