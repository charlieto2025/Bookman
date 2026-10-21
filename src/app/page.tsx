import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { createProject } from "@/app/actions";
import { projectLanguageLabels } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";

export default async function Home() {
  const user = await getCurrentUser();
  const { locale, dict } = await getDictionary();
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const langLabels = projectLanguageLabels[locale];

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.home.title}</h1>
        {projects.length === 0 ? (
          <p className="mt-3 text-zinc-500">{dict.home.empty}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="block rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-900/5 hover:ring-zinc-900/15"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="ml-2 text-sm text-zinc-400">
                    {p.language === "en" ? langLabels.en : langLabels.zh}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-900/5">
        <h2 className="text-lg font-semibold">{dict.home.newProjectTitle}</h2>
        <form action={createProject} className="mt-3 flex flex-col gap-3">
          <input
            name="title"
            placeholder={dict.home.titlePlaceholder}
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <select name="language" defaultValue="zh" className="rounded-lg border border-zinc-300 px-3 py-2">
            <option value="zh">{langLabels.zh}</option>
            <option value="en">{langLabels.en}</option>
          </select>
          <button
            type="submit"
            className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            {dict.home.create}
          </button>
        </form>
      </section>
    </div>
  );
}
