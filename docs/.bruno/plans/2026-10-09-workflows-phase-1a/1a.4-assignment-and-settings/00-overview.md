# Workflows Phase 1a.4: Assignment log and settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Read first:** `../00-shared.md` — Global Constraints, Rulings R1-R27, Assumptions, Task order, File map. Everything there binds every task here. Spec: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`.

**Goal:** `wbyWorkflowAssignment` model and repository (create, filtered and paged list) and `wbyWorkflowSettings` (one per tenant) with Get/Save use cases and exclusion validation.

**Depends on:** 1a.3 (feature wiring in `WorkflowsFeature`).

## Tasks

| # | File | Title |
|---|---|---|
| 10 | `task-10-assignment-log.md` | Assignment log model and repository |
| 11 | `task-11-workflow-settings.md` | Workflow settings model and use cases |

## Review Focus for this sub-phase

Assignment log filters and paging that phase 2 (delete all records of a review) and phase 4 (latest record per workflow+step, per user) rely on; settings rules D105 (unique user), D106 (last save wins), A1 (`includeExpired`). Task 11 ends with `registration.test.ts` checking every abstraction is registered once.

## Done when

Both tasks reviewed clean, final review of this sub-phase clean. Phase 1a complete; stop for the user.
