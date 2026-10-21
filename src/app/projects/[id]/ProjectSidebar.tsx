"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Chapter = { id: string; index: number; title: string };

export function ProjectSidebar(props: {
  projectId: string;
  projectTitle: string;
  projectLanguage: string;
  chapters: Chapter[];
  canonCount: number;
  pendingDiffCount: number;
}) {
  const { projectId, projectTitle, projectLanguage, chapters, canonCount, pendingDiffCount } = props;
  const pathname = usePathname();

  const navItems = [
    { href: `/projects/${projectId}/draft`, label: "写作 / 预测" },
    { href: `/projects/${projectId}/canon`, label: "故事设定", badge: canonCount > 0 ? String(canonCount) : undefined },
    { href: `/projects/${projectId}/upload`, label: "上传设定文档" },
    {
      href: `/projects/${projectId}/diffs`,
      label: "待审核的设定变更",
      badge: pendingDiffCount > 0 ? String(pendingDiffCount) : undefined,
      highlight: pendingDiffCount > 0,
    },
  ];

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 text-sm">
      <Link href="/" className="px-1 text-xs font-medium text-zinc-400 hover:text-zinc-600">
        ← 所有作品
      </Link>

      <Link
        href={`/projects/${projectId}`}
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-900/5 hover:ring-zinc-900/15"
      >
        <div className="truncate font-semibold text-zinc-900">{projectTitle}</div>
        <div className="mt-1 text-xs text-zinc-400">
          {projectLanguage === "zh" ? "中文" : "English"} · 共 {chapters.length} 章
        </div>
      </Link>

      <nav className="flex flex-col gap-0.5 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-900/5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                active
                  ? "bg-zinc-900 text-white"
                  : item.highlight
                    ? "text-amber-700 hover:bg-amber-50"
                    : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    active ? "bg-white/20" : item.highlight ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-900/5">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs font-semibold tracking-wide text-zinc-400">章节 {chapters.length}</span>
          <Link
            href={`/projects/${projectId}/chapters`}
            className={`text-xs ${
              pathname === `/projects/${projectId}/chapters` ? "font-medium text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            全部
          </Link>
        </div>
        {chapters.length === 0 ? (
          <div className="px-2 py-2 text-xs text-zinc-400">还没有章节</div>
        ) : (
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {chapters.map((c) => {
              const href = `/projects/${projectId}/chapters/${c.id}`;
              const active = pathname === href;
              return (
                <Link
                  key={c.id}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-2 py-2 ${
                    active ? "bg-rose-50 text-rose-700" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className={`w-5 shrink-0 text-xs ${active ? "text-rose-400" : "text-zinc-400"}`}>{c.index}</span>
                  <span className="truncate">{c.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
