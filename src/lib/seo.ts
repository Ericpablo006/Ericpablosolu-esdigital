import type { Metadata } from "next";
import { appUrl } from "@/lib/env";
import { getSettings } from "@/lib/settings";

/** Metadados por página: title, description, canonical e Open Graph. */
export async function pageMetadata(opts: { title: string; description?: string; path: string; image?: string | null; noindex?: boolean }): Promise<Metadata> {
  const s = await getSettings();
  const description = opts.description || s.seoDescription;
  const url = `${appUrl()}${opts.path}`;
  const image = opts.image ? (opts.image.startsWith("http") ? opts.image : `${appUrl()}${opts.image}`) : undefined;
  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${opts.title} | ${s.companyName}`,
      description,
      url,
      siteName: s.companyName,
      locale: "pt_BR",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: "summary_large_image", title: `${opts.title} | ${s.companyName}`, description },
  };
}
