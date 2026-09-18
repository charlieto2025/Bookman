"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { requireProject } from "@/lib/authz";
import { extractCanonProposals } from "@/lib/openai";
import type { CanonEntryType } from "@/generated/prisma/client";

const CANON_TYPES: CanonEntryType[] = ["CHARACTER", "WORLD", "TIMELINE", "OTHER"];

function asCanonType(value: FormDataEntryValue | null): CanonEntryType {
  const str = String(value ?? "");
  if ((CANON_TYPES as string[]).includes(str)) return str as CanonEntryType;
  return "OTHER";
}

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required");
  const language = String(formData.get("language") ?? "zh");

  const project = await db.project.create({
    data: { userId: user.id, title, language },
  });

  redirect(`/projects/${project.id}`);
}

export async function createCanonEntryManual(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProject(projectId);

  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!name || !content) throw new Error("Name and content are required");

  await db.canonEntry.create({
    data: {
      projectId,
      type: asCanonType(formData.get("type")),
      name,
      content,
    },
  });

  revalidatePath(`/projects/${projectId}/canon`);
}

export async function updateCanonEntry(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProject(projectId);

  const entryId = String(formData.get("entryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!name || !content) throw new Error("Name and content are required");

  await db.canonEntry.updateMany({
    where: { id: entryId, projectId },
    data: { name, content },
  });

  revalidatePath(`/projects/${projectId}/canon`);
}

export async function deleteCanonEntry(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProject(projectId);

  const entryId = String(formData.get("entryId") ?? "");
  await db.canonEntry.deleteMany({ where: { id: entryId, projectId } });

  revalidatePath(`/projects/${projectId}/canon`);
}

export async function resolveDiff(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProject(projectId);

  const diffId = String(formData.get("diffId") ?? "");
  const action = String(formData.get("action") ?? "");

  const diff = await db.canonDiff.findFirst({
    where: { id: diffId, projectId, status: "PENDING" },
  });
  if (!diff) return;

  if (action === "approve") {
    if (diff.type === "UPDATE" && diff.entryId) {
      await db.canonEntry.update({
        where: { id: diff.entryId },
        data: { name: diff.proposedName, content: diff.proposedContent },
      });
    } else {
      await db.canonEntry.create({
        data: {
          projectId,
          type: diff.category,
          name: diff.proposedName,
          content: diff.proposedContent,
        },
      });
    }
    await db.canonDiff.update({
      where: { id: diff.id },
      data: { status: "APPROVED", resolvedAt: new Date() },
    });
  } else {
    await db.canonDiff.update({
      where: { id: diff.id },
      data: { status: "REJECTED", resolvedAt: new Date() },
    });
  }

  revalidatePath(`/projects/${projectId}/diffs`);
  revalidatePath(`/projects/${projectId}/canon`);
}

export async function saveChapter(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  await requireProject(projectId);

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) throw new Error("Title and content are required");

  const last = await db.chapter.findFirst({
    where: { projectId },
    orderBy: { index: "desc" },
  });
  const nextIndex = (last?.index ?? 0) + 1;

  const chapter = await db.chapter.create({
    data: { projectId, index: nextIndex, title, content },
  });

  const existingEntries = await db.canonEntry.findMany({ where: { projectId } });
  const proposals = await extractCanonProposals({
    sourceText: content,
    sourceLabel: `第${nextIndex}章：${title}`,
    existingEntries,
  });

  if (proposals.length > 0) {
    const byName = new Map(existingEntries.map((e) => [`${e.type}:${e.name}`, e]));
    await db.canonDiff.createMany({
      data: proposals.map((p) => {
        const match = byName.get(`${p.category}:${p.entryName}`);
        return {
          projectId,
          chapterId: chapter.id,
          entryId: p.changeType === "UPDATE" ? match?.id : undefined,
          source: "CHAPTER" as const,
          type: match ? "UPDATE" : ("CREATE" as const),
          category: p.category,
          proposedName: p.entryName,
          proposedContent: p.content,
          rationale: p.rationale,
        };
      }),
    });
  }

  revalidatePath(`/projects/${projectId}/chapters`);

  if (proposals.length > 0) {
    redirect(`/projects/${projectId}/diffs`);
  } else {
    redirect(`/projects/${projectId}/chapters`);
  }
}
