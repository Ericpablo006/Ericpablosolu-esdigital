import { Download, ExternalLink, PackageOpen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/ui";
import { ButtonLink } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { EmptyState } from "@/components/ui/misc";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatDate } from "@/utils/format";

export const metadata = { title: "Downloads" };

export default async function ClientDownloads() {
  const user = await requireUser("/cliente/downloads");
  // Só aparecem produtos de pedidos com pagamento confirmado.
  const downloads = await db.download.findMany({ where: { userId: user.id, order: { status: "PAID" } }, orderBy: { createdAt: "desc" }, include: { product: true, order: { select: { number: true } } } });

  return (
    <>
      <PageHeader title="Downloads" description="Seus produtos digitais liberados após a confirmação do pagamento." />
      {downloads.length === 0 ? (
        <EmptyState icon={<PackageOpen className="h-6 w-6" />} title="Nenhum download disponível" description="Os produtos comprados aparecem aqui assim que o pagamento é confirmado." action={<ButtonLink href="/produtos">Ver produtos</ButtonLink>} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {downloads.map((d) => {
            const available = !!(d.product.fileKey || d.product.externalUrl);
            const external = !d.product.fileKey && !!d.product.externalUrl;
            return (
              <article key={d.id} className="panel overflow-hidden">
                <Cover src={d.product.images[0]} alt={d.product.name} category={d.product.category} seed={d.product.slug} sizes="(max-width:768px) 100vw, 33vw" className="aspect-[16/8]" />
                <div className="p-5">
                  <h2 className="font-display font-bold text-white">{d.product.name}</h2>
                  <p className="mt-1 text-xs text-steel">Pedido #{d.order.number} · {formatDate(d.createdAt)}</p>
                  <p className="mt-1 text-xs text-steel">{d.downloadCount}/{d.maxDownloads} downloads usados</p>
                  {available ? (
                    <a href={`/api/downloads/${d.id}`} className="btn btn-primary btn-sm mt-4 w-full">
                      {external ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />} {external ? "Acessar material" : "Baixar arquivo"}
                    </a>
                  ) : (
                    <p className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-steel">Arquivo em preparação. Avisaremos quando estiver disponível.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
