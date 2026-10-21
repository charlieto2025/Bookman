import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { resolveDiff } from "@/app/actions";
import { canonTypeLabels, chapterOrdinal, t } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";

export default async function DiffsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const { locale, dict } = await getDictionary();
  const typeLabels = canonTypeLabels[locale];
  const sourceLabels: Record<string, string> = {
    UPLOAD: dict.diffs.sourceUpload,
    CHAPTER: dict.diffs.sourceChapter,
    MANUAL: dict.diffs.sourceManual,
  };

  const diffs = await db.canonDiff.findMany({
    where: { projectId, status: "PENDING" },
    include: { chapter: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.diffs.title}</h1>

      {diffs.length === 0 ? (
        <p className="text-zinc-500">{dict.diffs.empty}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {diffs.map((diff) => (
            <div key={diff.id} className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded bg-white px-2 py-0.5">{typeLabels[diff.category]}</span>
                <span className="rounded bg-white px-2 py-0.5">
                  {diff.type === "CREATE" ? dict.diffs.typeCreate : dict.diffs.typeUpdate}
                </span>
                <span>{sourceLabels[diff.source] ?? diff.source}</span>
                {diff.chapter && (
                  <span>
                    {t(dict.diffs.chapterRef, { chapter: chapterOrdinal(diff.chapter.index, locale), title: diff.chapter.title })}
                  </span>
                )}
              </div>

              <div className="mt-2 font-medium">{diff.proposedName}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{diff.proposedContent}</p>
              {diff.rationale && (
                <p className="mt-2 text-xs italic text-zinc-500">{t(dict.diffs.rationaleLabel, { reason: diff.rationale })}</p>
              )}

              <div className="mt-3 flex gap-2">
                <form action={resolveDiff}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="diffId" value={diff.id} />
                  <input type="hidden" name="action" value="approve" />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800"
                  >
                    {dict.diffs.approve}
                  </button>
                </form>
                <form action={resolveDiff}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="diffId" value={diff.id} />
                  <input type="hidden" name="action" value="reject" />
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-100"
                  >
                    {dict.diffs.reject}
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
