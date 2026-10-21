import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getDictionary } from "@/lib/i18n-server";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const { dict } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.upload.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{dict.upload.desc}</p>
      </div>

      <form
        action={`/api/projects/${projectId}/upload`}
        method="post"
        encType="multipart/form-data"
        className="rounded-xl bg-zinc-50 p-5 ring-1 ring-zinc-900/5"
      >
        <input type="file" name="file" accept=".docx" required className="block" />
        <button
          type="submit"
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
        >
          {dict.upload.button}
        </button>
        <p className="mt-2 text-xs text-zinc-400">{dict.upload.note}</p>
      </form>
    </div>
  );
}
