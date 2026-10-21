import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { createCanonEntryManual, updateCanonEntry, deleteCanonEntry } from "@/app/actions";
import { canonTypeLabels } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n-server";
import type { CanonEntryType } from "@/generated/prisma/client";

export default async function CanonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const { locale, dict } = await getDictionary();
  const typeLabels = canonTypeLabels[locale];

  const entries = await db.canonEntry.findMany({
    where: { projectId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const grouped = (Object.keys(typeLabels) as CanonEntryType[]).map((type) => ({
    type,
    entries: entries.filter((e) => e.type === type),
  }));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.canon.title}</h1>

      {grouped.map(
        (group) =>
          group.entries.length > 0 && (
            <section key={group.type}>
              <h2 className="text-lg font-semibold text-zinc-700">{typeLabels[group.type]}</h2>
              <div className="mt-3 flex flex-col gap-3">
                {group.entries.map((entry) => (
                  <details key={entry.id} className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-900/5">
                    <summary className="cursor-pointer font-medium">{entry.name}</summary>
                    <form action={updateCanonEntry} className="mt-3 flex flex-col gap-2">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input
                        name="name"
                        defaultValue={entry.name}
                        required
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
                      />
                      <textarea
                        name="content"
                        defaultValue={entry.content}
                        required
                        rows={5}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-serif"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
                        >
                          {dict.canon.save}
                        </button>
                      </div>
                    </form>
                    <form action={deleteCanonEntry} className="mt-2">
                      <input type="hidden" name="projectId" value={projectId} />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        {dict.canon.delete}
                      </button>
                    </form>
                  </details>
                ))}
              </div>
            </section>
          ),
      )}

      <section className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-900/5">
        <h2 className="text-lg font-semibold">{dict.canon.addTitle}</h2>
        <form action={createCanonEntryManual} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="projectId" value={projectId} />
          <select name="type" defaultValue="CHARACTER" className="rounded-lg border border-zinc-300 bg-white px-3 py-2">
            {(Object.keys(typeLabels) as CanonEntryType[]).map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
          <input
            name="name"
            placeholder={dict.canon.namePlaceholder}
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2"
          />
          <textarea
            name="content"
            placeholder={dict.canon.contentPlaceholder}
            required
            rows={4}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-serif"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
          >
            {dict.canon.add}
          </button>
        </form>
      </section>
    </div>
  );
}
