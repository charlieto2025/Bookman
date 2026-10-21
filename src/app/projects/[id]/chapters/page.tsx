import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { saveChapter } from "@/app/actions";

export default async function ChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const chapters = await db.chapter.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">章节记录</h1>
        <p className="mt-2 text-sm text-zinc-500">
          在这里保存你最终确定的章节正文（写作/预测页只是草稿，请把你实际采用并修改好的版本粘贴到此处）。
          保存后系统会自动比对设定集，提出可能需要更新的人物 / 世界观 / 时间线信息供你审核。
        </p>
      </div>

      {chapters.length > 0 && (
        <ul className="flex flex-col gap-2">
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/projects/${projectId}/chapters/${c.id}`}
                className="block rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-900/5 hover:ring-zinc-900/15"
              >
                <div className="text-sm text-zinc-400">第 {c.index} 章</div>
                <div className="font-medium">{c.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-900/5">
        <h2 className="text-lg font-semibold">保存新章节（第 {chapters.length + 1} 章）</h2>
        <form action={saveChapter} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <input
            name="title"
            placeholder="章节标题"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
          />
          <textarea
            name="content"
            placeholder="章节正文"
            required
            rows={14}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-serif"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            保存章节
          </button>
        </form>
      </section>
    </div>
  );
}
