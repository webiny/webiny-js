# Each theme re-extraction creates a new theme entry

> **Package:** `@webiny/api-component-extraction` (the job's theme step), `@webiny/api-theme-extraction`
> **Severity:** low. Clutter in the Theme app, not a correctness problem; not a demo problem.
> **Status:** open, deliberately not changed (2026-10-09).

## What happens

A job's theme step publishes whatever extraction produces, and extraction always creates a theme. So
every Retry extraction leaves a new theme entry (version 1) in the Theme app, and the job pins the
newest. On webiny.com: `6ac8ad0a…` v1 from the first run, `6ac8b7c9…` v1 from the retry, both kept.

## Why it stays as it is

A retry genuinely produces a different theme, not a revision of the same one: a fresh crawl, a fresh
analysis. Pinning it as a new version of the first would imply a lineage that does not exist. Each
entry is honest about what happened.

## The cost, and what would address it

Theme-app clutter: one entry per extraction per job, with names like "<job name> (extracted)". If it
grows, the remedy is in the Theme app's view (group or hide extraction-made themes, or archive the
superseded ones a job no longer pins), not in versioning.
