# Workflows Phase 1a.2: Review aggregate

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Read first:** `../00-shared.md` — Global Constraints, Rulings R1-R27, Assumptions, Task order, File map. Everything there binds every task here. Spec: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`.

**Goal:** The pure, identity-free `Review` aggregate: request, reach (via the resolved assignment), start, take over, approve, reject, cancel, save preparation (current-step fields, `lastChangedOn`) and the `system.workflow` value. Unit tested, no storage.

**Depends on:** 1a.1 (workflow domain types).

## Tasks

| # | File | Title |
|---|---|---|
| 4 | `task-04-review-aggregate-request-start-take-over.md` | Review aggregate — request, reach, start, take over |
| 5 | `task-05-review-aggregate-approve-reject-cancel.md` | Review aggregate — approve, reject, cancel, save preparation and `system.workflow` |

## Review Focus for this sub-phase

From `../00-shared.md` Review Focus: item 1 (current-step fields drift), item 2 (requester or non-member acts), item 3 (wrong `system.workflow` value — aggregate side), item 6 (stale transition on the wrong step). All pinned by Task 4/5 unit tests.

## Done when

Both tasks reviewed clean, final review of this sub-phase clean. Stop for the user before 1a.3.
