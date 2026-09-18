import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export async function requireProject(projectId: string) {
  const user = await getCurrentUser();
  const project = await db.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) {
    throw new Error("Project not found");
  }
  return project;
}
