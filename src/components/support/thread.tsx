import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/format";

type Msg = { id: string; body: string; isStaff: boolean; createdAt: Date; author: { name: string } };

export function Thread({ messages, staffLabel = "Suporte" }: { messages: Msg[]; staffLabel?: string }) {
  return (
    <ol className="space-y-4" aria-label="Mensagens do chamado">
      {messages.map((m) => (
        <li key={m.id} className={cn("flex", m.isStaff ? "justify-start" : "justify-end")}>
          <div className={cn("max-w-[88%] rounded-2xl border px-4 py-3 sm:max-w-[75%]", m.isStaff ? "border-neon-2/30 bg-neon/10" : "border-white/10 bg-white/[0.04]")}>
            <p className="mb-1 text-xs font-semibold text-sky">{m.isStaff ? `${staffLabel} · ${m.author.name.split(" ")[0]}` : m.author.name}</p>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-silver">{m.body}</p>
            <p className="mt-2 text-[11px] text-steel">{formatDateTime(m.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
