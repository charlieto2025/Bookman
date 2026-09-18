import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const [canonCount, chapterCount, pendingDiffCount] = await Promise.all([
    db.canonEntry.count({ where: { projectId: id } }),
    db.chapter.count({ where: { projectId: id } }),
    db.canonDiff.count({ where: { projectId: id, status: "PENDING" } }),
  ]);

  const links = [
    { href: `/projects/${id}/draft`, label: "写作 / 预测", desc: "续写下一步、人物推演、代笔章节" },
    { href: `/projects/${id}/canon`, label: "故事设定", desc: `共 ${canonCount} 条` },
    { href: `/projects/${id}/chapters`, label: "章节记录", desc: `共 ${chapterCount} 章` },
    { href: `/projects/${id}/upload`, label: "上传设定文档", desc: "上传 .docx 文件" },
    {
      href: `/projects/${id}/diffs`,
      label: "待审核的设定变更",
      desc: pendingDiffCount > 0 ? `${pendingDiffCount} 条待审核` : "暂无待审核",
      highlight: pendingDiffCount > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← 所有作品
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg border bg-white p-4 hover:border-zinc-400 ${
              l.highlight ? "border-amber-400" : "border-zinc-200"
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
