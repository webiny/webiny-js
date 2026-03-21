---
name: webiny-skill-generator
description: >
  Generate, update, and maintain abstraction catalogs from the Webiny platform's public API.
  Use this skill whenever you need to: scan the `webiny` package to discover exported
  EventHandlers and UseCases, regenerate catalog JSON files after a platform release,
  check which abstractions are available, or add support for a new abstraction type.
---

# Webiny Skill Generator

Generates per-category **catalog JSON files** from the `webiny` npm package's public API. Each catalog lists all UseCase and EventHandler abstractions in a category with their resolved source file paths. LLMs read source files on demand for exact, up-to-date types — no enrichment phase needed.

## How It Works

```bash
yarn generate-skills
```

The script:

1. **Discovers** all EventHandler and UseCase exports from `packages/webiny`
2. **Resolves** the actual source file path for each export via ts-morph
3. **Writes** one catalog JSON per category to `skills/catalogs/`

That's it. No skeletons, no enrichment, no templates.

## Output

```
skills/
├── catalogs/
│   ├── api-cms.json           # 82 entries
│   ├── api-security.json      # 37 entries
│   ├── api-website-builder.json
│   ├── api-tenancy.json
│   ├── api-file-manager.json
│   ├── api-aco.json
│   ├── api-scheduler.json
│   └── api-system.json
└── patterns/
    ├── use-case.md            # Generic UseCase pattern doc
    └── event-handler.md       # Generic EventHandler pattern doc
```

Each catalog entry looks like:

```json
{
  "className": "CreateTenantUseCase",
  "importPath": "webiny/api/tenancy",
  "type": "use-case",
  "typeLabel": "UseCase",
  "humanName": "Create Tenant",
  "entity": "Tenant",
  "operation": "create",
  "sourceFilePath": "packages/api-core/src/features/tenancy/CreateTenant/index.ts",
  "description": "Programmatically create tenant."
}
```

## How LLMs Use Catalogs

1. **Find the right abstraction**: Read the catalog JSON for the relevant category
2. **Read the pattern doc**: `skills/patterns/use-case.md` or `skills/patterns/event-handler.md`
3. **Resolve types on demand**: Read the `sourceFilePath` from the catalog entry to get exact interfaces, payloads, and error types
4. **Generate code**: Use the pattern + resolved types to write the extension

This ensures types are always current — no stale snapshots.

## CLI Options

```bash
# Full regeneration
yarn generate-skills

# Verbose output
yarn generate-skills --verbose

# Check discovered exports without writing files
yarn generate-skills --check

# Only process a specific category
yarn generate-skills --category api/cms

# Only process a specific plugin type
yarn generate-skills --plugin event-handler
```

## Release Workflow

1. Run `yarn generate-skills` after a platform release
2. Commit the updated catalog files
3. That's it — no enrichment step needed

## Adding a New Abstraction Type

To support a new pattern (e.g., classes ending in `Middleware`):

1. Create a new plugin in `scripts/generateSkills/src/plugins/` implementing the `AbstractionPlugin` interface
2. Register it in `scripts/generateSkills/src/plugins/index.ts`
3. Run the pipeline — new entries appear in catalogs automatically
