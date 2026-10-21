import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { updateChapter } from "@/app/actions";

export default async function ChapterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; chapterId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id: projectId, chapterId } = await params;
  const { edit } = await searchParams;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const chapter = await db.chapter.findFirst({ where: { id: chapterId, projectId } });
  if (!chapter) notFound();

  if (edit) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm text-zinc-400">编辑第 {chapter.index} 章</div>
        <form action={updateChapter} className="flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="chapterId" value={chapter.id} />
          <input
            name="title"
            defaultValue={chapter.title}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xl font-semibold"
          />
          <textarea
            name="content"
            defaultValue={chapter.content}
            required
            rows={24}
            className="rounded-lg border border-zinc-300 px-3 py-2 font-serif leading-relaxed"
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700">
              保存
            </button>
            <Link
              href={`/projects/${projectId}/chapters/${chapter.id}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-50"
            >
              取消
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-400">第 {chapter.index} 章</div>
        <Link href={`?edit=1`} className="text-sm text-zinc-500 hover:underline">
          编辑
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{chapter.title}</h1>
      <div className="mt-4 whitespace-pre-wrap font-serif leading-relaxed text-zinc-800">
        {chapter.content}
      </div>
    </article>
  );
}
