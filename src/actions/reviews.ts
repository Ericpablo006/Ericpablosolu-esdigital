"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseForm, safely, type ActionState } from "@/lib/action";
import { requireUser } from "@/lib/auth/session";
import { zInt, zOptText } from "@/lib/validation";

const schema = z.object({ productId: z.string().min(1), rating: zInt(1, 5), comment: zOptText(1000) });

export async function submitReview(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return safely(async () => {
    const user = await requireUser();
    const parsed = parseForm(schema, fd);
    if (!parsed.success) return parsed.state;
    const { productId, rating, comment } = parsed.data;

    // Só quem comprou (pedido pago) pode avaliar.
    const bought = await db.download.findFirst({ where: { userId: user.id, productId, order: { status: "PAID" } } });
    if (!bought) return fail("Somente clientes que compraram este produto podem avaliar.");

    await db.productReview.upsert({
      where: { productId_userId: { productId, userId: user.id } },
      create: { productId, userId: user.id, rating, comment },
      update: { rating, comment },
    });
    const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
    if (product) revalidatePath(`/produtos/${product.slug}`);
    return ok("Avaliação enviada. Obrigado!");
  });
}
