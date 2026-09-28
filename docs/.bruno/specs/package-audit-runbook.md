# Package Audit Runbook

How to run a repo-wide code-health audit of `packages/`, so the next audit does not reinvent the process. It is based on the 2026-09 audit (outputs: `docs/reports/`, plan `docs/.bruno/plans/2026-09-27-audit-fix-plan.md`, handoffs `docs/.bruno/handoff/2026-09-2*`).

Read the whole runbook before starting. The rules in §1 are not optional.

## 1. Rules

1. **Security details never go into committed files.** Committed files may cite `SEC-n` IDs, package paths and severities only. Mechanisms, failure scenarios, exploit steps and fix details go in gitignored `docs/.reports/` (check that `docs/.reports` is still listed in `.gitignore` before you write anything there). This includes test-gap and recommendation text that says *what is missing*. For example, "no test for a `../` key on the read path" reveals the bug.
2. **Keep the audit branch unpushed** until a leakage scan (§8) is clean. Reports on the branch still list SEC IDs next to paths. If the branch has to be shared, publish the cleaned files from a fresh branch with no audit history. Earlier commits keep any text that was removed later.
3. **Never amend or revert.** Remove content in a new commit.
4. **No fixing during the audit.** Findings go into a written plan, the owner picks items, and fixes happen later in separate PRs.
5. **Audit one code line only.** Audit the branch you were asked to (normally `next`). Do not compare findings against release branches (6.4.x, 6.5 beta): `next` is a rewrite.
6. **Subagents never spawn subagents.** Only the main thread dispatches agents.
7. **Record the audit commit** (`git rev-parse --short HEAD`) at the start. Every report header and the index cite it.

## 2. Setup

- Create a branch: `bruno/chore/<slug>` or similar. It's docs only.
- Check that CodeGraph is indexed (`.codegraph/` exists) and working: `codegraph explore "<some symbol>"`. Agents use it before grep/Read.
- jscpd is not a repo dependency. Run it with `npx jscpd`.
- Create the private folder `docs/.reports/` with `security.md` (header: "Private Security Findings — not committed; audit commit: <sha>").

## 3. Compute dependency levels

Audit bottom-up: level 0 has no internal `@webiny/*` dependencies, and level N depends only on levels < N. This way an agent auditing a package can rely on lower-level reports already existing.

The script below reproduced the 2026-09 levels exactly: 156 packages, levels 0–14. It counts `dependencies` + `peerDependencies`; `devDependencies` are ignored. Run it from the repo root:

```js
// levels.mjs — node levels.mjs
import fs from "node:fs";
import path from "node:path";
const root = "packages";
const pkgs = {};
for (const dir of fs.readdirSync(root)) {
    const file = path.join(root, dir, "package.json");
    if (!fs.existsSync(file)) continue;
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    pkgs[json.name] = { dir, deps: Object.keys({ ...json.dependencies, ...json.peerDependencies }) };
}
const internal = name => name in pkgs;
const level = {};
const visit = (name, stack = []) => {
    if (name in level) return level[name];
    if (stack.includes(name)) throw new Error(`Cycle: ${[...stack, name].join(" -> ")}`);
    const deps = pkgs[name].deps.filter(d => internal(d) && d !== name);
    level[name] = deps.length ? 1 + Math.max(...deps.map(d => visit(d, [...stack, name]))) : 0;
    return level[name];
};
Object.keys(pkgs).forEach(n => visit(n));
const byLevel = {};
for (const [name, l] of Object.entries(level)) (byLevel[l] ??= []).push(pkgs[name].dir);
for (const l of Object.keys(byLevel).sort((a, b) => a - b))
    console.log(`${l}\t${byLevel[l].length}\t${byLevel[l].sort().join(" ")}`);
```

- Directories under `packages/` without a `package.json` are leftovers. List them in `docs/reports/_empty-package-dirs.md` (check with `git ls-files packages/<dir>`), and don't audit them.
- Not every `@webiny/*` import is internal. Some are external npm packages. The script only counts packages that exist in `packages/`.

## 4. Slice large packages

One agent handles about 200 source files well. Split bigger packages into feature-area slices, with one report per slice in `docs/reports/level-NN/<package>/<slice>.md`. In 2026-09 we sliced packages above about 210 `src` files (`git ls-files packages/<p>/src | wc -l`):

| Package | Slices |
|---|---|
| `api-headless-cms` (657) | content-entry, crud-and-utils, graphql-and-storage, models |
| `app-headless-cms` (652) | admin, entries-and-renderers, features, model-editor |
| `app-website-builder` (827) | base-editor, editor-sdk-and-misc, features, presentation |
| `app-admin` (725) | components-and-base, features-and-permissions, form-model, presentation |
| `admin-ui` (789) | navigation-and-data, pickers, primitives |
| `api-core`, `api-website-builder`, `ai-powerups`, `app-file-manager`, `project`, `app-aco`, `project-aws` | 2 each |

Choose slice boundaries from the folder structure (`src/features/*`, `src/presentation/*`) so that each slice owns whole folders.

## 5. Per-package audit (Phase 1)

Run one level at a time and wait for a level to finish before starting the next. Within a level, dispatch agents in parallel (the `Agent` tool, general-purpose or `feature-dev:code-reviewer`), with one agent per package or slice. Keep batches small enough that you can process each reply before sending the next batch.

### 5.1 Agent prompt template

```
Audit the package `packages/<dir>` (slice: <slice or "whole package">) in /Users/…/webiny-js at commit <sha>.
Read-only: do NOT edit code, do NOT commit, do NOT spawn subagents.

Use CodeGraph first (`codegraph explore "<symbol or question>"`), then grep/Read.
Lower-level packages already have reports in docs/reports/level-*/ — read the relevant ones instead of re-auditing dependencies.
Run `npx jscpd packages/<dir>/src --min-lines 10 --reporters console --silent` for duplication.

Check: correctness bugs (with a concrete failure scenario), duplication, dead code (confirm zero consumers with CodeGraph/grep),
AGENTS.md convention violations, test gaps, and security issues.

SECURITY: if you find a security issue, do NOT describe it in the report. In the report, write only
"Security finding — see private notes" in the Bugs table row (severity, location = file path only).
Put the full description (problem, failure scenario, precondition, fix, test gap) in your final reply under a heading
"PRIVATE SECURITY FINDINGS". Do not mention the mechanism anywhere in the report, including Test gaps and Recommendations.

Write the report to docs/reports/level-NN/<dir>.md (or <dir>/<slice>.md) using the template in
docs/.bruno/specs/package-audit-runbook.md §5.2. Reply with: report path, bug count by severity, and the private findings block.
```

The main thread moves each "PRIVATE SECURITY FINDINGS" block into `docs/.reports/security.md` as `## SEC-n: @webiny/<pkg> — <title>`. IDs are sequential and never reused. Then it replaces the report row with `Security finding SEC-n — see private notes.`

### 5.2 Report template

```markdown
# @webiny/<package> — <slice title, if sliced>

> Level N · commit <sha> · audited YYYY-MM-DD

## Summary
What the package does, overall health, the 1–2 most important findings.

## Public API
Exports that other packages use, with their confirmed consumers.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|

## Duplication
jscpd results plus cross-package copies.

## Dead code
Only with zero consumers confirmed via CodeGraph/grep.

## Convention issues
AGENTS.md violations (DI naming, one abstraction per file, inline types, barrel exports).

## Test gaps
What is untested (no security mechanisms here).

## Recommendations
Numbered, most important first.
```

Severity: critical / high / medium / low. Confidence: high / medium / low.

### 5.3 Index

After each level, update `docs/reports/README.md`: a progress table plus a "Level N — top findings" table with the columns Package | Finding | Severity | Verified. At the end, add "Cross-cutting observations": bugs repeated across packages, shared root causes, and copy-pasted code carrying the same bug.

## 6. Verification pass (Phase 2)

First-pass severities are often overstated. Verify before planning:

- **Security findings:** group them by theme (2026-09 used A missing authz, B identity/permissions, C tenant/websockets, D client exec/XSS, E file manager, F infrastructure, G auth/transport, H ACO/workflows/misc). Give each group one strong-model agent (Opus or Fable). The agent re-reads the code and returns, per finding: verdict (CONFIRMED / DOWNGRADED / REFUTED / UNVERIFIED), verified severity, precondition, corrected fix. Output goes only to `docs/.reports/verification/<group>.md` plus `SUMMARY.md`.
- **Top non-security findings:** spot-check the index's top finding per package. Mark the result in the index "Verified" column (Yes / No / Plausible) and in the plan's *Repro* column: ✅ reproduced by running code, 🔍 confirmed by reading code only, ❌ refuted, ☐ unchecked.
- Record verified severities privately. Public reports keep only the ID.

## 7. Plans (Phase 3)

- **Public plan** (`docs/.bruno/plans/YYYY-MM-DD-audit-fix-plan.md`) has:
  - Phase A: shared root causes.
  - Phase B: bugs by area.
  - Phase C: duplication.
  - Phase D: dead code (IDs `D-n`).
  - Phase E: test gaps.
  - Owner questions (IDs `Qn`; don't use `Dn`, it clashes with Phase D).
  - A suggested order.
  - Each item has a Size (S/M/L) and a Repro mark. Default "done when": a regression test fails before the fix and passes after.
- **Security plan** (`docs/.reports/fix-plan.md`, private): phases by verified severity, per-item fix and tests, decisions recorded, PR hygiene (neutral PR titles; no SEC IDs or "vulnerability" wording in public commits or PRs).
- **Review both plans** with a strong model in fresh agents (Fable 5: `model: "fable"`), with 2–3 rounds. The security review output goes only to `docs/.reports/`. Apply the findings in a new plan version, and note the version at the top.
- Then go through the open questions with the owner one by one. Record each decision in the plan (✅ Decided YYYY-MM-DD) and commit.

## 8. Leakage scan (before any push or share)

Scan every committed file under `docs/` for security mechanisms:

```bash
git ls-files docs | xargs grep -nE "SEC-[0-9]+" | grep -v "see private notes"
git ls-files docs | xargs grep -niE "traversal|containment|without (an )?auth|no permission check|bypass|escalat|injection|unsanitized|verify.*hash"
```

Then have an agent read every line that cites a `SEC-n`, and flag any line that describes *what* is wrong, *how* to trigger it or *what the fix changes*. Reduce each flagged line to `Security finding SEC-n — see private notes.` Archive the original text at the end of `docs/.reports/security.md`.

## 9. Lessons from 2026-09

- **Code comments lie.** Agents trusted a comment in `website-builder-nuxt` that described behaviour the code doesn't have. Tell agents to verify behaviour in the code, not in comments or docs.
- **Monorepo conventions look like bugs.** For example, every package is version `0.0.0` (the real version is set at publish), and the `webiny` meta package re-exports deep internal paths by design. Check with the owner before you plan a "fix" for a convention.
- **Some findings are intended behaviour:** the mailer dummy transport, for example. Put questions like this in the plan's owner questions, not straight into Phase B.
- **Know the release state before planning disclosure.** An unreleased branch needs no CVE, advisory or embargo process. Ask the owner early.
- **A proposed fix can break other callers.** Plan reviews must check every caller of a changed function, not just the changed line.
- **It takes several sessions.** Write a handoff (`docs/.bruno/handoff/`) at the end of each one.
