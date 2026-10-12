# The jobs list returns fifty and says nothing

> **Package:** `@webiny/api-component-extraction` (`componentExtractionListJobs`), read by the
> extractions list and board in `@webiny/app-component-extraction`.
> **Severity:** low at 27 jobs; wrong counts on the board past 50.
> **Status:** open. Found 2026-10-12 while scoping the extractions board.

## What happens

`componentExtractionListJobs` takes no arguments. Its resolver (`graphql/schema.ts`, the
`componentExtractionListJobs` resolver) calls `jobRepository.list()` with no parameters, which
defaults to the 50 most recently saved jobs (`DEFAULT_LIMIT = 50`, sort `savedOn_DESC`,
`features/repositories.ts`). The cursor and total count the repository returns are dropped. Nothing
reports that a 51st job exists.

The resolver then looks up each job's latest run one at a time.

## Why it matters now

The board counts each column from what the list returned. Past 50 jobs the counts, the "Show more"
totals and the gate banner's "N jobs you own" all undercount, and the oldest jobs drop off the list
silently. The same shape as the 1,000-component cap: a limit nothing reports.

## The fix

Return `meta` (cursor, total) from the query and page in the admin, or move the per-status counts to
the server. At a few hundred jobs the counts belong on the server; the per-job run lookup becomes the
cost to fix with it.
