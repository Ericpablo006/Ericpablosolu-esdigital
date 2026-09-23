import { Badge } from "./misc";
import { ORDER_STATUS, PAYMENT_STATUS, PROJECT_STATUS, QUOTE_STATUS, TICKET_STATUS } from "@/types/labels";

const MAPS = {
  order: ORDER_STATUS,
  payment: PAYMENT_STATUS,
  project: PROJECT_STATUS,
  quote: QUOTE_STATUS,
  ticket: TICKET_STATUS,
} as const;

export function StatusBadge({ kind, status }: { kind: keyof typeof MAPS; status: string }) {
  const entry = MAPS[kind][status];
  return <Badge tone={entry?.tone ?? "gray"}>{entry?.label ?? status}</Badge>;
}
