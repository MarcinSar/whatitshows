// The problems a merged ticket holds, by what each report shows. Pages explain it; this file is what runs.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

// Most reports show a day and a month swapped. causes.ts tells which bug swapped them: the shared
// parser, or booking-v3's date hint. Some reports show no swap at all: the date lands one day off,
// or two people in two time zones get two different days. Neither swap makes that, so it is a
// problem of its own. The desk lists the reports that show it (desk-notes.json, `oneDayMove`).
//
// Counts follow the desk's own view (CauseTable): every report is counted under its cause, by
// tenant. A one-day report keeps its place there and is counted again under `one-day`.
export type Problem = Cause | 'one-day' | 'unplaced';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // For `one-day`: the causes these reports are filed under, cause → count.
  filedUnder?: Partial<Record<Problem, number>>;
};

function group(problem: Problem, rs: Report[], filedUnder?: ProblemGroup['filedUnder']): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    filedUnder,
  };
}

// One report counts once (the export's pages overlap).
export function problemsIn(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): { merged: Report[]; groups: ProblemGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const filed = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const byCause = new Map<Problem, Report[]>();
  for (const r of merged) byCause.set(filed(r), [...(byCause.get(filed(r)) ?? []), r]);
  const groups = [...byCause.entries()].map(([p, rs]) => group(p, rs)).sort((a, b) => b.reports.length - a.reports.length);
  const moved = merged.filter((r) => oneDay.includes(r.id));
  if (moved.length) {
    const under = moved.reduce<Partial<Record<Problem, number>>>((n, r) => ({ ...n, [filed(r)]: (n[filed(r)] ?? 0) + 1 }), {});
    groups.push(group('one-day', moved, under));
  }
  return { merged, groups };
}
