import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { createProject } from "@/app/actions";

export default async function Home() {
  const user = await getCurrentUser();
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">我的作品</h1>
        {projects.length === 0 ? (
          <p className="mt-3 text-zinc-500">还没有作品，先在下面创建一个吧。</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="ml-2 text-sm text-zinc-400">{p.language}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-semibold">新建作品</h2>
        <form action={createProject} className="mt-3 flex flex-col gap-3">
          <input
            name="title"
            placeholder="作品名称"
            required
            className="rounded border border-zinc-300 px-3 py-2"
          />
          <select name="language" defaultValue="zh" className="rounded border border-zinc-300 px-3 py-2">
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
          <button
            type="submit"
            className="self-start rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            创建
          </button>
        </form>
      </section>
    </div>
  );
}
