import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { DraftClient } from "./DraftClient";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const user = await getCurrentUser();
  const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/projects/${projectId}`} className="text-sm text-zinc-500 hover:underline">
          ← 返回作品
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">写作 / 预测</h1>
        <p className="mt-2 text-sm text-zinc-500">
          生成的内容仅供参考，请自行复制到你的手稿中；本工具不会自动保存到章节记录。
        </p>
      </div>
      <DraftClient projectId={projectId} />
    </div>
  );
}
