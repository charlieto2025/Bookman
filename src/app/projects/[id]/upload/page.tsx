import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">上传设定文档</h1>
        <p className="mt-2 text-sm text-zinc-500">
          上传包含故事背景、人物设定等信息的 Word 文档（.docx）。系统会自动提取其中的设定信息，
          生成变更提案供你审核后再正式加入设定集。
        </p>
      </div>

      <form
        action={`/api/projects/${projectId}/upload`}
        method="post"
        encType="multipart/form-data"
        className="rounded-lg border border-zinc-200 bg-white p-5"
      >
        <input type="file" name="file" accept=".docx" required className="block" />
        <button
          type="submit"
          className="mt-4 rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-700"
        >
          上传并提取设定
        </button>
        <p className="mt-2 text-xs text-zinc-400">
          处理可能需要一些时间，取决于文档长度，请耐心等待页面跳转。
        </p>
      </form>
    </div>
  );
}
