import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { saveChapter } from "@/app/actions";
import { chapterOrdinal, t } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";

export default async function ChaptersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const { locale, dict } = await getDictionary();

  const chapters = await db.chapter.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.chapters.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{dict.chapters.desc}</p>
      </div>

      {chapters.length > 0 && (
        <ul className="flex flex-col gap-2">
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/projects/${projectId}/chapters/${c.id}`}
                className="block rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-900/5 hover:ring-zinc-900/15"
              >
                <div className="text-sm text-zinc-400">{chapterOrdinal(c.index, locale)}</div>
                <div className="font-medium">{c.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-900/5">
        <h2 className="text-lg font-semibold">
          {t(dict.chapters.saveNewTitle, { chapter: chapterOrdinal(chapters.length + 1, locale) })}
        </h2>
        <form action={saveChapter} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <input
            name="title"
            placeholder={dict.chapters.titlePlaceholder}
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
          />
          <textarea
            name="content"
            placeholder={dict.chapters.contentPlaceholder}
            required
            rows={14}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-serif"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            {dict.chapters.save}
          </button>
        </form>
      </section>
    </div>
  );
}
