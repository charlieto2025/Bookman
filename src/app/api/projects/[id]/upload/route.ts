import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireProject } from "@/lib/authz";
import { extractTextFromDocx } from "@/lib/docx";
import { extractCanonProposals } from "@/lib/anthropic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  await requireProject(projectId);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractTextFromDocx(buffer);

  const upload = await db.upload.create({
    data: { projectId, filename: file.name, rawText: text, status: "PENDING" },
  });

  const existingEntries = await db.canonEntry.findMany({ where: { projectId } });
  const proposals = await extractCanonProposals({
    sourceText: text,
    sourceLabel: file.name,
    existingEntries,
  });

  if (proposals.length > 0) {
    const byName = new Map(existingEntries.map((e) => [`${e.type}:${e.name}`, e]));
    await db.canonDiff.createMany({
      data: proposals.map((p) => {
        const match = byName.get(`${p.category}:${p.entryName}`);
        return {
          projectId,
          entryId: p.changeType === "UPDATE" ? match?.id : undefined,
          source: "UPLOAD" as const,
          type: match ? "UPDATE" : ("CREATE" as const),
          category: p.category,
          proposedName: p.entryName,
          proposedContent: p.content,
          rationale: p.rationale,
        };
      }),
    });
  }

  await db.upload.update({ where: { id: upload.id }, data: { status: "PROCESSED" } });

  return NextResponse.redirect(new URL(`/projects/${projectId}/diffs`, request.url), { status: 303 });
}
