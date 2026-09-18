import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { createCanonEntryManual, updateCanonEntry, deleteCanonEntry } from "@/app/actions";
import type { CanonEntryType } from "@/generated/prisma/client";

const TYPE_LABELS: Record<CanonEntryType, string> = {
  CHARACTER: "人物",
  WORLD: "世界观",
  TIMELINE: "时间线",
  OTHER: "其他",
};

export default async function CanonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const entries = await db.canonEntry.findMany({
    where: { projectId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const grouped = (Object.keys(TYPE_LABELS) as CanonEntryType[]).map((type) => ({
    type,
    entries: entries.filter((e) => e.type === type),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/projects/${projectId}`} className="text-sm text-zinc-500 hover:underline">
          ← 返回作品
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">故事设定集</h1>
      </div>

      {grouped.map(
        (group) =>
          group.entries.length > 0 && (
            <section key={group.type}>
              <h2 className="text-lg font-semibold text-zinc-700">{TYPE_LABELS[group.type]}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {group.entries.map((entry) => (
                  <details key={entry.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                    <summary className="cursor-pointer font-medium">{entry.name}</summary>
                    <form action={updateCanonEntry} className="mt-3 flex flex-col gap-2">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input
                        name="name"
                        defaultValue={entry.name}
                        required
                        className="rounded border border-zinc-300 px-3 py-2"
                      />
                      <textarea
                        name="content"
                        defaultValue={entry.content}
                        required
                        rows={5}
                        className="rounded border border-zinc-300 px-3 py-2 font-serif"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
                        >
                          保存修改
                        </button>
                      </div>
                    </form>
                    <form action={deleteCanonEntry} className="mt-2">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        删除该条目
                      </button>
                    </form>
                  </details>
                ))}
              </div>
            </section>
          ),
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">手动添加设定条目</h2>
        <form action={createCanonEntryManual} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <select name="type" defaultValue="CHARACTER" className="rounded border border-zinc-300 px-3 py-2">
            {(Object.keys(TYPE_LABELS) as CanonEntryType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input name="name" placeholder="名称" required className="rounded border border-zinc-300 px-3 py-2" />
          <textarea
            name="content"
            placeholder="详细内容"
            required
            rows={4}
            className="rounded border border-zinc-300 px-3 py-2 font-serif"
          />
          <button
            type="submit"
            className="self-start rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            添加
          </button>
        </form>
      </section>
    </div>
  );
}
