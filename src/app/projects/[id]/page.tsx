import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { t, canonCountLabel, chapterCountLabel } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const { locale, dict } = await getDictionary();

  const [canonCount, chapterCount, pendingDiffCount] = await Promise.all([
    db.canonEntry.count({ where: { projectId: id } }),
    db.chapter.count({ where: { projectId: id } }),
    db.canonDiff.count({ where: { projectId: id, status: "PENDING" } }),
  ]);

  const links = [
    { href: `/projects/${id}/draft`, label: dict.dashboard.write, desc: dict.dashboard.writeDesc },
    { href: `/projects/${id}/canon`, label: dict.dashboard.canon, desc: canonCountLabel(canonCount, locale) },
    { href: `/projects/${id}/chapters`, label: dict.dashboard.chapters, desc: chapterCountLabel(chapterCount, locale) },
    { href: `/projects/${id}/upload`, label: dict.dashboard.upload, desc: dict.dashboard.uploadDesc },
    {
      href: `/projects/${id}/diffs`,
      label: dict.dashboard.diffs,
      desc: pendingDiffCount > 0 ? t(dict.dashboard.diffsPending, { n: pendingDiffCount }) : dict.dashboard.diffsEmpty,
      highlight: pendingDiffCount > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-900/5 hover:ring-zinc-900/15 ${
              l.highlight ? "ring-amber-300" : ""
            }`}
          >
            <div className="font-medium">{l.label}</div>
            <div className="mt-1 text-sm text-zinc-500">{l.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
