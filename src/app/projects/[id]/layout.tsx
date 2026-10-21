import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getDictionary } from "@/lib/i18n-server";
import { ProjectSidebar } from "./ProjectSidebar";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const { locale, dict } = await getDictionary();

  const [chapters, canonCount, pendingDiffCount] = await Promise.all([
    db.chapter.findMany({ where: { projectId }, orderBy: { index: "asc" } }),
    db.canonEntry.count({ where: { projectId } }),
    db.canonDiff.count({ where: { projectId, status: "PENDING" } }),
  ]);

  return (
    <div className="flex items-start gap-6">
      <ProjectSidebar
        locale={locale}
        dict={dict}
        projectId={projectId}
        projectTitle={project.title}
        projectLanguage={project.language}
        chapters={chapters.map((c) => ({ id: c.id, index: c.index, title: c.title }))}
        canonCount={canonCount}
        pendingDiffCount={pendingDiffCount}
      />
      <div className="min-w-0 flex-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-900/5">
        {children}
      </div>
    </div>
  );
}
