<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { problemsIn, type Problem } from '#lib/kb/problems';

  // `issues`: where each problem is tracked, problem → issue number in `repo`.
  let { ticket, repo, issues = {} }: { ticket: number; repo: string; issues?: Partial<Record<Problem, number>> } = $props();

  const split = $derived(problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const placed = $derived(split.groups.reduce((n, g) => n + g.reports.length, 0));
  const received = $derived(split.merged.map((r) => r.receivedAt.slice(0, 10)).sort().at(-1));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}
            <a href="https://github.com/{repo}/issues/{issues[g.problem]}">{repo}#{issues[g.problem]}</a>
          {:else}
            <span class="warn">no ticket yet</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="check" class:warn={placed !== split.merged.length}>
  {placed} of {split.merged.length} reports placed, each in one problem · data: reports received up to {received}
</p>

<style>
  .sum { font-size: 1.1rem; }
  .muted, .check { color: var(--muted); font-size: 0.85em; }
  .warn { color: var(--warn); font-weight: 600; }
</style>
