# Workflows Phase 1a.1: Workflow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Read first:** `../00-shared.md` — Global Constraints, Rulings R1-R27, Assumptions, Task order, File map. Everything there binds every task here. Spec: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`.

**Goal:** Remove the old review-state code, old GraphQL schema and the CMS/WB handlers built on them; add the new workflow domain (types, review step config schema, validator) and replace the workflow model, repository, Get/List/Store/Delete use cases and events.

**Depends on:** phase 0 (landed).

## Tasks

| # | File | Title |
|---|---|---|
| 1 | `task-01-remove-old-review-code.md` | Remove the old review-state code, the old GraphQL schema and their consumers |
| 2 | `task-02-workflow-domain-and-validator.md` | Workflow domain types, review step config schema and validator |
| 3 | `task-03-workflow-model-repository-use-cases.md` | Replace the workflow model, repository, use cases and events |

## Review Focus for this sub-phase

From `../00-shared.md` Review Focus: item 4 (lost workflow edits: stale `savedOn` → `Workflows/Workflow/Conflict`, deleted workflow → `Workflows/Workflow/NotFound`), pinned by Task 3. Also: Task 1 must leave every package (api-workflows, api-headless-cms-workflows, api-website-builder-workflows, api-event-handler-core) building with no importer of a deleted symbol.

## Done when

All three tasks reviewed clean, final review of this sub-phase clean. Stop for the user before 1a.2.
