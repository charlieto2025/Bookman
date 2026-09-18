import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/authz";
import { streamDraft, type DraftMode } from "@/lib/anthropic";

const VALID_MODES: DraftMode[] = ["predict_next", "character_what_if", "draft_chapter"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  await requireProject(projectId);

  const body = await request.json();
  const mode: DraftMode = VALID_MODES.includes(body.mode) ? body.mode : "predict_next";
  const instructions: string = String(body.instructions ?? "").trim();
  if (!instructions) {
    return new Response("instructions is required", { status: 400 });
  }

  const [entries, recent] = await Promise.all([
    db.canonEntry.findMany({ where: { projectId }, orderBy: { updatedAt: "desc" } }),
    db.chapter.findMany({ where: { projectId }, orderBy: { index: "desc" }, take: 2 }),
  ]);

  const canonContext = entries.map((e) => `[${e.type}] ${e.name}\n${e.content}`).join("\n\n");
  const recentChapters = recent
    .reverse()
    .map((c) => `## 第${c.index}章：${c.title}\n${c.content}`)
    .join("\n\n");

  const anthropicStream = streamDraft({ mode, canonContext, recentChapters, instructions });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      anthropicStream.abort();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
