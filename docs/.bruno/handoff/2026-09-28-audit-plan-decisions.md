# Session Handoff — 2026-09-28 — Audit plan reviews and decisions

## What was done

- Public audit fix plan (`docs/.bruno/plans/2026-09-27-audit-fix-plan.md`) went from v2 to v4:
  - v3 added the 🔍 code-read mark (separate from ✅), renamed decisions D1–D6 to Q1–Q6 (Phase D keeps D-1..D-6), split B2.3 into B2.3a (scheduler only) and B2.3b (global, blocked by Q5), and added a note to check with the plan owner before starting an item.
  - A Fable review (private output: `docs/.reports/public-plan-review-fable.md`) found 0 blockers, 7 should-fix and 9 nits. All were applied in v4: A2a decoupled from Q1, new B3.8, api-opensearch cursor copy added to A3, B2.3a touch points listed, B5.5 fix moved to system-requirements, cognito rollback folded into B7.3, new B4.7, extra instances added, marks corrected, wording toned down.
- Security fix plan (private, `docs/.reports/fix-plan.md`) went from v3 to v5:
  - A Fable review (`docs/.reports/fix-plan-review-3-fable.md`) found 2 blockers, 6 should-fix and 5 nits. All were applied in v4.
  - v5 reflects the owner's scope decisions (see below). The advisory, CVE and embargo process was removed and replaced by release gates and PR hygiene rules.
  - Added the missing `## SEC-3:` heading in `docs/.reports/security.md`.
- Leakage cleanup: removed the lines that described security mechanisms from 9 committed reports and 1 older handoff. They are now ID-only references. The original text is archived at the end of `docs/.reports/security.md`. Earlier commits still contain the text.
- Decisions Q1–Q4 recorded in the public plan.
- 7 commits (`82daec4d51`..`2cd994ad03`), docs only. No tests were run because no code changed.

## Key decisions

- **Scope:** every finding is in `next`, which is a complete rewrite. It is unreleased and not deployed anywhere real. Never compare findings against the 6.4.x or 6.5 (beta) branches. Webiny admin and API always deploy together.
- **Fix channel:** normal PRs on `next` with neutral titles, commit messages and descriptions. No SEC IDs, no "vulnerability"/"bypass" wording, and no links to `docs/.reports/`. Tests describe behaviour, not attacks. No single "security fixes" PR.
- **Release gates** for the `next` release (a couple of months out, no date set):
  - Phase 0 is fixed first.
  - Phase 1 must be done before release.
  - Phase 2 is the target for release; any item left open needs owner sign-off.
  - Phase 3 can follow the release.
- **Security plan:** implementation decisions for SEC-58 and SEC-53 are recorded in the private `docs/.reports/fix-plan.md` (v5).
- **Q1:** record locks are enforced on the server (B3.8):
  - Writes by non-owners are rejected.
  - System writes under `withoutAuthorization` pass.
  - API keys count as non-owners.
  - There is no full-access bypass.
  - An expired lock counts as unlocked.
  - There is no check when the feature flag is off.
- **Q2:** the mailer dummy transport is intended. B7.7 is dropped.
- **Q3:** full Nuxt parity through a Nitro middleware (new B4.8). Shared parsing goes in `website-builder-sdk`.
- **Q4:** the `webiny` meta package stays as it is, by design. B7.11 is dropped.
- The rules from the previous session still apply: never push `bruno/chore/repo-wide-analysis`, never amend or revert, and security details live only in the gitignored `docs/.reports/`.

## Current state

- Branch: `bruno/chore/repo-wide-analysis`, 26 commits on top of `19c9ca1b91`, no upstream. Nothing pushed, on purpose.
- Format check: passing. Build and tests were not run (docs only).
- Private files changed but not committed (gitignored): `docs/.reports/fix-plan.md` (v5), `security.md` (SEC-3 heading and the archive of removed lines), and the two Fable review files.

## What might come next

- **Wait for the 6.4 → 6.5 → `next` merge.** The owner says many findings and open questions are already fixed in 6.4/6.5 but not yet merged into `next`.
- After the merge, **re-verify the audit against the merged `next`**, not against the old branches:
  - Mark each public plan item and each SEC finding as still present, fixed by the merge, or changed.
  - Update the *Repro* column and `security.md`.
  - The audit commit `19c9ca1b91` is then out of date. Record the new base commit.
- Then continue the decisions:
  - **Q5 (open, in discussion):** `DateTimePicker` `dateTimeLocal` writes the local wall-clock time as `…Z`, but parse and display read it as UTC. This makes CMS `dateTimeWithoutTimezone` values drift on edit, and scheduling and the audit-log filter use wrong instants.
    - Recommendation: two clear modes. `dateTimeLocal` stays wall-clock, with a literal parse and the stored format unchanged. A new `dateTimeInstant` emits `toISOString()`, and the scheduler and audit-log filter switch to it.
    - This would merge B2.3a and B2.3b into one item. There's no migration concern, since nothing is deployed.
    - Two sub-questions are pending: the new type name, and keeping the format.
  - **Q6:** optimistic versioning (A2b).
  - **SEC-39** (in the private plan): is content review advisory or enforced?
- After the decisions: implement Phase 0 and the public quick wins (A3, A5, B5.1, B6.1, B6.2, B6.6, B7.1, B2.3a or its Q5 replacement) as normal PRs from fresh branches off `next`.
