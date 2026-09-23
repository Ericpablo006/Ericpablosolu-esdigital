"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign, Bell, Briefcase, CreditCard, Download, FileText, FolderKanban, Globe, Headset, LayoutDashboard, LifeBuoy, LogOut, Menu, Package, Receipt, Settings, ShoppingBag, Store, Tag, Ticket, User, UserCog, Users, X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logout } from "@/actions/auth";
import { markNotificationsRead } from "@/actions/notifications";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/format";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, users: Users, package: Package, globe: Globe, cart: ShoppingBag, quote: FileText, projects: FolderKanban,
  payments: CreditCard, portfolio: Briefcase, plans: BadgeDollarSign, coupons: Tag, support: Headset, settings: Settings, download: Download,
  user: User, receipt: Receipt, help: LifeBuoy, ticket: Ticket, manager: UserCog,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean; badge?: number };
export type NotificationItem = { id: string; title: string; body: string | null; href: string | null; read: boolean; createdAt: string };

export function DashboardShell({
  nav, companyName, logoUrl, user, area, notifications, unread, children,
}: {
  nav: NavItem[];
  companyName: string;
  logoUrl: string;
  user: { name: string; email: string };
  area: "client" | "admin" | "manager";
  /** Sem notificações (ex.: área do gerente), o sino não é exibido. */
  notifications?: NotificationItem[];
  unread?: number;
  children: React.ReactNode;
}) {
  const home = area === "admin" ? "/admin" : area === "manager" ? "/gerente" : "/cliente";
  const areaLabel = area === "admin" ? "Administração" : area === "manager" ? "Gerência" : "Área do Cliente";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const active = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] shrink-0 items-center border-b border-white/8 px-5">
        <Logo companyName={companyName} logoUrl={logoUrl} href={home} />
      </div>
      <p className="px-5 pb-2 pt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-steel">{areaLabel}</p>
      <nav aria-label={`Menu — ${areaLabel}`} className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const isActive = active(item);
          return (
            <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={cn("group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-gradient-to-r from-neon/25 to-transparent text-white shadow-[inset_2px_0_0_var(--color-sky)]" : "text-silver hover:bg-white/5 hover:text-white")}>
              <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-sky" : "text-steel group-hover:text-sky")} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge ? <span className="rounded-full bg-neon px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{item.badge > 99 ? "99+" : item.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-white/8 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-silver transition hover:bg-white/5 hover:text-white"><Store className="h-[18px] w-[18px] text-steel" aria-hidden /> Ver o site</Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-silver transition hover:bg-danger/10 hover:text-danger"><LogOut className="h-[18px] w-[18px]" aria-hidden /> Sair</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-[264px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-white/8 bg-ink-2/90 backdrop-blur-xl lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-white/10 bg-ink-2 shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-white/8 bg-ink/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white lg:hidden"><Menu className="h-5 w-5" /></button>
        <div className="hidden lg:block" />
        <div className="ml-auto flex items-center gap-3">
          {notifications && <NotificationBell items={notifications} unread={unread ?? 0} />}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon to-cyan text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-[160px] truncate text-sm font-semibold leading-tight text-white">{user.name}</span>
              <span className="block max-w-[160px] truncate text-[11px] leading-tight text-steel">{user.email}</span>
            </span>
          </div>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function NotificationBell({ items, unread }: { items: NotificationItem[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} aria-expanded={open} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-silver transition hover:border-sky hover:text-white">
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1 text-[10px] font-bold text-white shadow-[0_0_10px_rgb(29_107_255_/_0.9)]">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <button aria-label="Fechar notificações" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <p className="font-display font-bold text-white">Notificações</p>
              {unread > 0 && (
                <form action={markNotificationsRead}>
                  <button type="submit" className="text-xs font-semibold text-sky hover:text-white">Marcar como lidas</button>
                </form>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-steel hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <ul className="max-h-[360px] divide-y divide-white/5 overflow-y-auto">
              {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-steel">Nenhuma notificação por enquanto.</li>}
              {items.map((n) => {
                const inner = (
                  <>
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-white/15" : "bg-sky shadow-[0_0_8px_rgb(92_176_255_/_0.9)]")} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-silver">{n.body}</span>}
                      <span className="block text-[11px] text-steel">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.href ? <Link href={n.href} className="flex gap-3 px-4 py-3 transition hover:bg-white/5">{inner}</Link> : <div className="flex gap-3 px-4 py-3">{inner}</div>}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
