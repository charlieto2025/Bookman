import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { getDictionary } from "@/lib/i18n-server";
import { DraftClient } from "./DraftClient";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  const { dict } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{dict.draft.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{dict.draft.desc}</p>
      </div>
      <DraftClient projectId={projectId} dict={dict.draft} />
    </div>
  );
}
