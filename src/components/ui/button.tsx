import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "whatsapp";
export type ButtonSize = "sm" | "md" | "lg";

export const buttonClass = (variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) =>
  cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", size === "lg" && "btn-lg", className);

type LinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

/** Link com aparência de botão (usa <a> comum para links externos, ex.: WhatsApp). */
export function ButtonLink({ variant, size, className, href, ...rest }: LinkProps) {
  const cls = buttonClass(variant, size, className);
  if (typeof href === "string" && /^(https?:|mailto:|tel:)/.test(href)) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        className={cls}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(rest as ComponentProps<"a">)}
      />
    );
  }
  return <Link href={href} className={cls} {...rest} />;
}
