import { db } from "@/lib/db";

export async function notifyUser(userId: string, title: string, body?: string, href?: string) {
  await db.notification.create({ data: { userId, title, body, href } });
}

/** Notifica todos os administradores ativos. */
export async function notifyAdmins(title: string, body?: string, href?: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
  if (!admins.length) return;
  await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title, body, href })) });
}

export const unreadCount = (userId: string) => db.notification.count({ where: { userId, read: false } });

export const recentNotifications = (userId: string, take = 8) =>
  db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
