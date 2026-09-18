import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { resolveDiff } from "@/app/actions";
import type { CanonEntryType } from "@/generated/prisma/client";

const TYPE_LABELS: Record<CanonEntryType, string> = {
  CHARACTER: "人物",
  WORLD: "世界观",
  TIMELINE: "时间线",
  OTHER: "其他",
};

const SOURCE_LABELS: Record<string, string> = {
  UPLOAD: "来自上传文档",
  CHAPTER: "来自新章节",
  MANUAL: "手动添加",
};

export default async function DiffsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const diffs = await db.canonDiff.findMany({
    where: { projectId, status: "PENDING" },
    include: { chapter: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/projects/${projectId}`} className="text-sm text-zinc-500 hover:underline">
          ← 返回作品
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">待审核的设定变更</h1>
      </div>

      {diffs.length === 0 ? (
        <p className="text-zinc-500">目前没有待审核的变更。</p>
      ) : (
        <div className="flex flex-col gap-4">
          {diffs.map((diff) => (
            <div key={diff.id} className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded bg-white px-2 py-0.5">{TYPE_LABELS[diff.category]}</span>
                <span className="rounded bg-white px-2 py-0.5">
                  {diff.type === "CREATE" ? "新增条目" : "更新条目"}
                </span>
                <span>{SOURCE_LABELS[diff.source] ?? diff.source}</span>
                {diff.chapter && <span>· 第{diff.chapter.index}章：{diff.chapter.title}</span>}
              </div>

              <div className="mt-2 font-medium">{diff.proposedName}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{diff.proposedContent}</p>
              {diff.rationale && (
                <p className="mt-2 text-xs italic text-zinc-500">理由：{diff.rationale}</p>
              )}

              <div className="mt-3 flex gap-2">
                <form action={resolveDiff}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="diffId" value={diff.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button
                    type="submit"
                    className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800"
                  >
                    采纳
                  </button>
                </form>
                <form action={resolveDiff}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="diffId" value={diff.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button
                    type="submit"
                    className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100"
                  >
                    忽略
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
