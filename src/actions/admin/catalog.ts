"use server";

// Produtos, serviços, portfólio, planos e cupons — CRUD do painel administrativo.
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { deleteStoredFile } from "@/lib/storage";
import { zBool, zHttpUrlOptional, zImageList, zImageRef, zInt, zLines, zMoney, zMoneyOptional, zOptDateInput, zOptText } from "@/lib/validation";
import { fromInputDate } from "@/utils/format";
import { parseMoneyToCents } from "@/utils/money";
import { SERVICE_ICON_OPTIONS } from "@/components/brand/icons";

const bust = (...paths: string[]) => paths.forEach((p) => revalidatePath(p));

async function uniqueSlug(model: "product" | "service", base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || "item";
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? root : `${root}-${i + 1}`;
    const found = model === "product" ? await db.product.findUnique({ where: { slug } }) : await db.service.findUnique({ where: { slug } });
    if (!found || found.id === exceptId) return slug;
  }
  return `${root}-${Date.now()}`;
}

// ── Produtos ─────────────────────────────────────────────────

const productSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(3).max(150),
    category: z.string().trim().min(2).max(60),
    shortDescription: zOptText(200),
    description: z.string().trim().min(10, "Descreva o produto (mín. 10 caracteres).").max(10000),
    features: zLines,
    includes: zLines,
    requirements: zLines,
    price: zMoney,
    promoPrice: zMoneyOptional,
    promoEndsAt: zOptDateInput,
    images: zImageList,
    fileKey: z.string().trim().optional().transform((v) => (v ? v : null)).refine((v) => v === null || /^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/.test(v), "Arquivo inválido."),
    fileName: zOptText(150),
    externalUrl: zHttpUrlOptional.refine((v) => v === null || v.startsWith("https://"), "Use um link https://"),
    active: zBool,
    featured: zBool,
  })
  .refine((d) => d.promoPrice === null || d.promoPrice < d.price, { path: ["promoPrice"], message: "A promoção deve ser menor que o preço." });

export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(productSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, price, promoPrice, promoEndsAt, ...d } = parsed.data;
    const data = {
      ...d,
      priceCents: price,
      promoPriceCents: promoPrice,
      promoEndsAt: promoEndsAt ? fromInputDate(promoEndsAt) : null,
      fileName: d.fileKey ? d.fileName : null,
    };
    if (id) {
      const current = await db.product.findUnique({ where: { id } });
      if (!current) return fail("Produto não encontrado.");
      await db.product.update({ where: { id }, data });
      if (current.fileKey && current.fileKey !== data.fileKey) await deleteStoredFile(current.fileKey);
      bust("/produtos", `/produtos/${current.slug}`, "/admin/produtos", "/");
      return ok("Produto atualizado.", { redirectTo: "/admin/produtos" });
    }
    const slug = await uniqueSlug("product", d.name);
    await db.product.create({ data: { ...data, slug } });
    bust("/produtos", "/admin/produtos", "/");
    return ok("Produto criado.", { redirectTo: "/admin/produtos" });
  });
}

const idSchema = z.object({ id: z.string().min(1) });

export async function toggleProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const p = await db.product.findUnique({ where: { id: parsed.data.id } });
    if (!p) return fail("Produto não encontrado.");
    await db.product.update({ where: { id: p.id }, data: { active: !p.active } });
    bust("/produtos", `/produtos/${p.slug}`, "/admin/produtos", "/");
    return ok(p.active ? "Produto desativado." : "Produto ativado.");
  });
}

export async function deleteProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const p = await db.product.findUnique({ where: { id: parsed.data.id }, include: { _count: { select: { orderItems: true } } } });
    if (!p) return fail("Produto não encontrado.");
    // Produtos já vendidos preservam o histórico e o acesso dos clientes: só podem ser desativados.
    if (p._count.orderItems > 0) return fail("Este produto já foi vendido e não pode ser excluído. Desative-o para tirá-lo da loja.");
    await db.product.delete({ where: { id: p.id } });
    await deleteStoredFile(p.fileKey);
    bust("/produtos", "/admin/produtos", "/");
    return ok("Produto excluído.", { redirectTo: "/admin/produtos" });
  });
}

// ── Serviços ─────────────────────────────────────────────────

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(3).max(120),
  homeLabel: zOptText(60),
  shortDescription: z.string().trim().min(5).max(220),
  description: z.string().trim().min(10).max(5000),
  benefits: zLines,
  deliveryTime: zOptText(100),
  startingPrice: zMoneyOptional,
  icon: z.enum(SERVICE_ICON_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  image: zImageRef,
  quoteType: z.enum(["SITE", "ECOMMERCE", "LANDING", "SYSTEM", "APP", "DESIGN", "MARKETING", "OTHER"]),
  sortOrder: zInt(0, 9999),
  featured: zBool,
  active: zBool,
});

export async function saveService(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(serviceSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, startingPrice, ...d } = parsed.data;
    const data = { ...d, startingPriceCents: startingPrice };
    if (id) {
      if (!(await db.service.findUnique({ where: { id } }))) return fail("Serviço não encontrado.");
      await db.service.update({ where: { id }, data });
    } else {
      await db.service.create({ data: { ...data, slug: await uniqueSlug("service", d.name) } });
    }
    bust("/servicos", "/admin/servicos", "/");
    return ok(id ? "Serviço atualizado." : "Serviço criado.", { redirectTo: "/admin/servicos" });
  });
}

export async function toggleService(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const s = await db.service.findUnique({ where: { id: parsed.data.id } });
    if (!s) return fail("Serviço não encontrado.");
    await db.service.update({ where: { id: s.id }, data: { active: !s.active } });
    bust("/servicos", "/admin/servicos", "/");
    return ok(s.active ? "Serviço desativado." : "Serviço ativado.");
  });
}

export async function deleteService(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const s = await db.service.findUnique({ where: { id: parsed.data.id } });
    if (!s) return fail("Serviço não encontrado.");
    await db.service.delete({ where: { id: s.id } });
    await deleteStoredFile(s.image);
    bust("/servicos", "/admin/servicos", "/");
    return ok("Serviço excluído.", { redirectTo: "/admin/servicos" });
  });
}

// ── Portfólio ────────────────────────────────────────────────

const portfolioSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(150),
  client: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(2000),
  technologies: z.string().optional().transform((v) => (v ?? "").split(/[,\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 20)),
  image: zImageRef,
  url: zHttpUrlOptional,
  sortOrder: zInt(0, 9999),
  active: zBool,
});

export async function savePortfolio(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(portfolioSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, ...data } = parsed.data;
    if (id) {
      if (!(await db.portfolioItem.findUnique({ where: { id } }))) return fail("Projeto não encontrado.");
      await db.portfolioItem.update({ where: { id }, data });
    } else await db.portfolioItem.create({ data });
    bust("/portfolio", "/admin/portfolio", "/");
    return ok(id ? "Projeto atualizado." : "Projeto adicionado.", { redirectTo: "/admin/portfolio" });
  });
}

export async function togglePortfolio(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const p = await db.portfolioItem.findUnique({ where: { id: parsed.data.id } });
    if (!p) return fail("Projeto não encontrado.");
    await db.portfolioItem.update({ where: { id: p.id }, data: { active: !p.active } });
    bust("/portfolio", "/admin/portfolio", "/");
    return ok(p.active ? "Projeto ocultado." : "Projeto publicado.");
  });
}

export async function deletePortfolio(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const p = await db.portfolioItem.findUnique({ where: { id: parsed.data.id } });
    if (!p) return fail("Projeto não encontrado.");
    await db.portfolioItem.delete({ where: { id: p.id } });
    await deleteStoredFile(p.image);
    bust("/portfolio", "/admin/portfolio", "/");
    return ok("Projeto excluído.", { redirectTo: "/admin/portfolio" });
  });
}

// ── Planos ───────────────────────────────────────────────────

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(200),
  price: zMoney,
  billing: z.enum(["ONE_TIME", "MONTHLY"]),
  features: zLines,
  sortOrder: zInt(0, 9999),
  highlighted: zBool,
  active: zBool,
});

export async function savePlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(planSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, price, ...d } = parsed.data;
    const data = { ...d, priceCents: price };
    if (id) {
      if (!(await db.plan.findUnique({ where: { id } }))) return fail("Plano não encontrado.");
      await db.plan.update({ where: { id }, data });
    } else await db.plan.create({ data });
    bust("/planos", "/admin/planos");
    return ok(id ? "Plano atualizado." : "Plano criado.", { redirectTo: "/admin/planos" });
  });
}

export async function togglePlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const p = await db.plan.findUnique({ where: { id: parsed.data.id } });
    if (!p) return fail("Plano não encontrado.");
    await db.plan.update({ where: { id: p.id }, data: { active: !p.active } });
    bust("/planos", "/admin/planos");
    return ok(p.active ? "Plano desativado." : "Plano ativado.");
  });
}

export async function deletePlan(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    await db.plan.deleteMany({ where: { id: parsed.data.id } });
    bust("/planos", "/admin/planos");
    return ok("Plano excluído.", { redirectTo: "/admin/planos" });
  });
}

// ── Cupons ───────────────────────────────────────────────────

const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Use 3–30 letras, números, _ ou -."),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.string().trim().min(1),
  minOrder: zMoneyOptional,
  maxUses: z.string().trim().optional().transform((v) => (v ? parseInt(v, 10) : null)).refine((v) => v === null || (Number.isInteger(v) && v > 0), "Informe um número maior que zero."),
  expiresAt: zOptDateInput,
  active: zBool,
});

export async function saveCoupon(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(couponSchema, fd);
    if (!parsed.success) return parsed.state;
    const { id, value, minOrder, expiresAt, ...d } = parsed.data;

    let cents: number;
    if (d.type === "PERCENT") {
      cents = parseInt(value, 10);
      if (!Number.isInteger(cents) || cents < 1 || cents > 100) return fail("Informe uma porcentagem de 1 a 100.", { value: "Use um valor de 1 a 100." });
    } else {
      const parsedMoney = parseMoneyToCents(value);
      if (parsedMoney === null || parsedMoney <= 0) return fail("Valor inválido.", { value: "Informe um valor em reais." });
      cents = parsedMoney;
    }
    const data = { ...d, value: cents, minOrderCents: minOrder ?? 0, expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59-03:00`) : null };
    try {
      if (id) await db.coupon.update({ where: { id }, data });
      else await db.coupon.create({ data });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") return fail("Já existe um cupom com esse código.", { code: "Código já utilizado." });
      throw e;
    }
    bust("/admin/cupons");
    return ok(id ? "Cupom atualizado." : "Cupom criado.", { redirectTo: "/admin/cupons" });
  });
}

export async function toggleCoupon(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    const c = await db.coupon.findUnique({ where: { id: parsed.data.id } });
    if (!c) return fail("Cupom não encontrado.");
    await db.coupon.update({ where: { id: c.id }, data: { active: !c.active } });
    bust("/admin/cupons");
    return ok(c.active ? "Cupom desativado." : "Cupom ativado.");
  });
}

export async function deleteCoupon(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    await requireAdmin();
    const parsed = parseForm(idSchema, fd);
    if (!parsed.success) return parsed.state;
    await db.coupon.deleteMany({ where: { id: parsed.data.id } });
    bust("/admin/cupons");
    return ok("Cupom excluído.", { redirectTo: "/admin/cupons" });
  });
}
