# Workflows Phase 1a.3: Review persistence and use cases

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Read first:** `../00-shared.md` — Global Constraints, Rulings R1-R27, Assumptions, Task order, File map. Everything there binds every task here. Spec: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`.

**Goal:** `wbyWorkflowReview` model and repository, workflow delete blocked while reviews run, the lifecycle collaborators (`ReviewTargetLoader`, no-op `ReviewTargetSync`, pool-only `StepAssignmentResolver`, `ReviewStepReacher`), the single save path `ReviewSaver` with review events, and the request/get and transition use cases.

**Depends on:** 1a.1 (workflow repository), 1a.2 (aggregate).

## Tasks

| # | File | Title |
|---|---|---|
| 6 | `task-06-review-model-repository-delete-block.md` | Review model and repository; block workflow delete while reviews run |
| 7 | `task-07-review-lifecycle-collaborators.md` | Review lifecycle collaborators — target loader, target sync, resolver, step reacher, single save path, events |
| 8 | `task-08-request-and-get-review.md` | Request and get review use cases |
| 9 | `task-09-review-transition-use-cases.md` | Start, take over, approve, reject and cancel use cases |

## Review Focus for this sub-phase

From `../00-shared.md` Review Focus: item 2 and 6 through the use cases (Task 9), item 3 (full synced-value list per transition, Task 9), item 5 (delete blocked while reviews run, Task 6), item 7 (OpenSearch lag on the active-review check and delete block, Tasks 6/8). R16 save-failure policy is pinned in Tasks 7/8. OpenSearch is the target storage (D63); `yarn test:os` cannot run locally — record it as not run.

## Done when

All four tasks reviewed clean, final review of this sub-phase clean. Stop for the user before 1a.4.
