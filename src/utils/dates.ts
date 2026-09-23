// Cálculo de períodos (fuso America/Sao_Paulo, UTC−3 fixo — o Brasil não usa horário de verão desde 2019).
const OFFSET_H = 3;

const spParts = (d: Date) => {
  const s = new Date(d.getTime() - OFFSET_H * 3600 * 1000);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate(), dow: s.getUTCDay() };
};

/** Início do dia (00:00 em São Paulo) do instante informado. */
export function startOfDaySP(date: Date): Date {
  const { y, m, d } = spParts(date);
  return new Date(Date.UTC(y, m, d, OFFSET_H, 0, 0, 0));
}

export const startOfMonthSP = (date: Date) => {
  const { y, m } = spParts(date);
  return new Date(Date.UTC(y, m, 1, OFFSET_H));
};

export const startOfYearSP = (date: Date) => new Date(Date.UTC(spParts(date).y, 0, 1, OFFSET_H));

export const startOfWeekSP = (date: Date) => {
  const day = startOfDaySP(date);
  return new Date(day.getTime() - spParts(date).dow * 86400_000); // semana começa no domingo
};

export const addMonthsSP = (date: Date, n: number) => {
  const { y, m } = spParts(date);
  return new Date(Date.UTC(y, m + n, 1, OFFSET_H));
};

export type RangeKey = "today" | "week" | "month" | "year" | "custom";

export function resolveRange(key: string | undefined, from?: string, to?: string, now = new Date()): { key: RangeKey; start: Date; end: Date; label: string } {
  const endOfToday = new Date(startOfDaySP(now).getTime() + 86400_000);
  switch (key) {
    case "today":
      return { key: "today", start: startOfDaySP(now), end: endOfToday, label: "Hoje" };
    case "week":
      return { key: "week", start: startOfWeekSP(now), end: endOfToday, label: "Esta semana" };
    case "year":
      return { key: "year", start: startOfYearSP(now), end: endOfToday, label: "Este ano" };
    case "custom": {
      const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
      if (ok(from) && ok(to)) {
        const start = new Date(`${from}T00:00:00-03:00`);
        const end = new Date(new Date(`${to}T00:00:00-03:00`).getTime() + 86400_000);
        if (start < end) return { key: "custom", start, end, label: "Período personalizado" };
      }
      break;
    }
  }
  return { key: "month", start: startOfMonthSP(now), end: endOfToday, label: "Este mês" };
}
