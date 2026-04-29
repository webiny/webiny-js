# Skill Catalog Architecture

## Overview

The skill system uses **per-category catalog JSON files** to list all UseCase and EventHandler abstractions exported from the `webiny` package. Instead of generating hundreds of individual skill files with baked-in type snapshots, the catalogs point to actual source files. LLMs resolve types on demand by reading source code directly.

## Design Principles

- **Catalog, not content**: Catalogs list abstractions with source paths. No type snapshots, no examples, no enrichment.
- **Two pattern docs**: Generic UseCase and EventHandler patterns are documented once in `skills/patterns/`.
- **On-demand type resolution**: LLM reads `sourceFilePath` from catalog entries only when generating code.
- **Always current**: Types come from actual source files, never from stale snapshots.
- **Minimal pipeline**: Discover exports → resolve source paths → write catalog JSON. No templates, no rendering, no enrichment phase.

## Output Structure

```
skills/
├── catalogs/
│   ├── api-cms.json
│   ├── api-security.json
│   ├── api-website-builder.json
│   ├── api-tenancy.json
│   ├── api-file-manager.json
│   ├── api-aco.json
│   ├── api-scheduler.json
│   └── api-system.json
└── patterns/
    ├── use-case.md
    └── event-handler.md
```

## Catalog Format

Each catalog JSON has this shape:

```json
{
  "generatedAt": "2026-03-21T...",
  "category": {
    "id": "api/tenancy",
    "label": "API — Tenancy",
    "description": "Tenant lifecycle and installation hooks."
  },
  "entries": [
    {
      "className": "CreateTenantUseCase",
      "importPath": "webiny/api/tenancy",
      "sourceFilePath": "packages/api-core/src/features/tenancy/CreateTenant/index.ts",
      "description": "Programmatically create tenant."
    }
  ]
}
```

EventHandler entries additionally have a `timing` field ("before" | "after").

## How LLMs Use This

1. Read the relevant catalog JSON to find the abstraction
2. Read the pattern doc (`skills/patterns/use-case.md` or `skills/patterns/event-handler.md`)
3. Read the `sourceFilePath` to get exact types (interfaces, payloads, errors)
4. Generate code using the pattern + resolved types

## Pipeline

The generator script at `scripts/generateSkills/` does three things:

1. **Discover**: Scan `packages/webiny/package.json` exports, find all `*EventHandler` and `*UseCase` classes
2. **Resolve**: Follow re-export chains via ts-morph to find the actual source file for each abstraction
3. **Write**: Emit one catalog JSON per category to `skills/catalogs/`

### Key Files

| File                     | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `src/bin.ts`             | CLI entry point                                       |
| `src/pipeline.ts`        | Orchestrates discover → resolve → write               |
| `src/discovery.ts`       | Scans webiny barrel files for matching exports        |
| `src/source-resolver.ts` | ts-morph utilities for following re-exports           |
| `src/config.ts`          | Category map, description builders                    |
| `src/plugins/`           | Plugin per abstraction type (event-handler, use-case) |
| `src/name-utils.ts`      | PascalCase/kebab-case converters                      |
| `src/types.ts`           | TypeScript interfaces                                 |

### Plugin Interface

Each plugin implements:

- `matches(exportName)` — does this plugin claim an export?
- `parseName(className, importPath, layer)` — parse into entity/timing/operation
- `buildDescription(parsed)` — generate a short description

## Adding a New Abstraction Type

1. Create a plugin in `src/plugins/` implementing `AbstractionPlugin`
2. Register it in `src/plugins/index.ts`
3. Create a pattern doc in `skills/patterns/`
4. Run `yarn generate-skills`
