"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useCart } from "@/components/cart/cart-provider";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/servicos", label: "Serviços" },
  { href: "/produtos", label: "Produtos" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/planos", label: "Planos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader({ companyName, logoUrl, user }: { companyName: string; logoUrl: string; user: { name: string; role: "CUSTOMER" | "ADMIN" | "MANAGER" } | null }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const areaHref = user ? (user.role === "ADMIN" ? "/admin" : user.role === "MANAGER" ? "/gerente" : "/cliente") : "/entrar";
  const areaLabel = user ? (user.role === "ADMIN" ? "Painel admin" : user.role === "MANAGER" ? "Painel do gerente" : "Área do Cliente") : "Área do Cliente";

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled || open ? "border-b border-white/8 bg-ink/80 backdrop-blur-xl" : "border-b border-transparent")}>
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Logo companyName={companyName} logoUrl={logoUrl} />

        <nav aria-label="Principal" className="hidden items-center gap-1 xl:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn("relative rounded-lg px-3.5 py-2 text-sm font-medium transition", isActive(item.href) ? "text-white" : "text-silver hover:text-white")}>
              {item.label}
              {isActive(item.href) && <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-sky to-transparent" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/carrinho" aria-label={`Carrinho${count ? `, ${count} item(ns)` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-silver transition hover:border-sky hover:text-white">
            <ShoppingCart className="h-[18px] w-[18px]" />
            {count > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-neon px-1 text-[11px] font-bold text-white shadow-[0_0_12px_rgb(29_107_255_/_0.9)]">{count}</span>}
          </Link>
          <Link href={areaHref} className={cn(buttonClass("outline", "sm"), "hidden xl:inline-flex")}>
            <User className="h-4 w-4" aria-hidden />
            {areaLabel}
          </Link>
          <Link href="/orcamento" className={cn(buttonClass("primary", "sm"), "hidden sm:inline-flex")}>
            Solicitar orçamento
          </Link>
          <button type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white xl:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-white/8 bg-ink/95 xl:hidden">
          <nav aria-label="Menu móvel" className="container-x flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn("rounded-xl px-4 py-3 text-base font-medium transition", isActive(item.href) ? "bg-neon/15 text-white" : "text-silver hover:bg-white/5 hover:text-white")}>
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Link href="/orcamento" className={buttonClass("primary")}>Solicitar orçamento</Link>
              <Link href={areaHref} className={buttonClass("outline")}>
                <User className="h-4 w-4" aria-hidden />
                {areaLabel}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
