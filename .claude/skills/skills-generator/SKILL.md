---
name: webiny-skill-generator
description: >
  Generate, update, and maintain MCP skills from the Webiny platform's public API.
  Use this skill whenever you need to: scan the `webiny` package to discover exported
  EventHandlers and UseCases, generate individual skill files from those exports,
  regenerate skills after a platform release, build or update the skill-index.json
  that powers the MCP list_webiny_skills tool, or check which skills are outdated
  after source code changes. Also use when adding support for a new abstraction type,
  updating templates, or debugging why a generated skill has incorrect types.
---

# Webiny Skill Generator

Generates MCP skills from the `webiny` npm package's public API. Each exported abstraction (EventHandler, UseCase) becomes one skill. Generation is fully automated and deterministic.

## Quick Start

Before doing anything, read the architecture reference:

```
references/architecture.md
```

That file contains the full design: folder structure, MCP tool responses, index format, manifest schema, release workflow, and all design decisions. Consult it for any architectural question.

## How It Works

1. **Discover** — Scan the `webiny` package exports for classes ending in `EventHandler` or `UseCase`
2. **Extract types** — Use the TS compiler API to resolve each class's public type surface
3. **Generate skills** — Stamp each discovered class through the appropriate template
4. **Generate index** — Build `skill-index.json` from all skills (generated + hand-authored)
5. **Generate manifests** — Write `skill.manifest.json` for each skill, linking back to source files

## Templates

Templates live as sibling files in this skill's `templates/` directory. **Always read the relevant template before generating a skill.**

| Template           | Use For                          | Read From                              |
| ------------------ | -------------------------------- | -------------------------------------- |
| EventHandler skill | Classes ending in `EventHandler` | `templates/event-handler-skill.md.hbs` |
| UseCase skill      | Classes ending in `UseCase`      | `templates/use-case-skill.md.hbs`      |
| Manifest           | Every generated skill            | `templates/skill.manifest.json.hbs`    |
| Skill index        | The `skill-index.json` file      | `templates/skill-index.json.hbs`       |

## Step 1 — Discovery

Scan the `webiny` package to find all public API exports. The package is located in the project's monorepo. Its exports are defined via `package.json` `exports` field or barrel files.

For each export path (e.g., `webiny/api/cms/entry`), find all exported classes matching known patterns:

- `*EventHandler` — lifecycle event hooks
- `*UseCase` — use case abstractions

Record for each discovered class:

- `className` — the exported name (e.g., `EntryBeforeCreateEventHandler`)
- `importPath` — the `webiny/...` import path
- `abstractionType` — `EventHandler` or `UseCase`

### Parsing Class Names

Class names follow a strict convention: `{Entity}{Timing}{Operation}{Type}`

For EventHandlers:

- `EntryBeforeCreateEventHandler` → entity: `entry`, timing: `before`, operation: `create`
- `ApiKeyAfterUpdateEventHandler` → entity: `api-key`, timing: `after`, operation: `update`
- `SystemInstalledEventHandler` → entity: `system`, timing: (none), operation: `installed`

For UseCases:

- Class name structure may vary. Parse what you can; fall back to the full name for description generation.

### Category Mapping

Derive the category from the import path:

| Import Path Pattern            | Category          |
| ------------------------------ | ----------------- |
| `webiny/api/cms/*`             | `cms`             |
| `webiny/api/security/*`        | `security`        |
| `webiny/api/website-builder/*` | `website-builder` |
| `webiny/api/tenancy/*`         | `tenancy`         |
| `webiny/api/system/*`          | `system`          |

Categories map to the second-level path segment after `webiny/api/`. If a new path appears that doesn't match, create a new category using the path segment as the ID.

### Entity Derivation

The entity is derived from the class name prefix (before the timing word). It is used to group skills within a category in the index.

- `EntryBeforeCreate...` → entity: `Entry`
- `ModelAfterUpdate...` → entity: `Model`
- `ApiKeyBeforeDelete...` → entity: `ApiKey`
- `PageBeforePublish...` → entity: `Page`

## Step 2 — Type Extraction

For each discovered class, extract the public type surface using the TypeScript compiler API. The goal is a **self-contained type block** that an agent can read and use directly — no imports from internal packages, no unresolved generics.

Extract these namespace members:

- `.Interface` — the handler/use-case interface the developer implements
- `.Event` (EventHandlers) or `.Params` (UseCases) — the input type

Flatten all referenced types. If `Event` references a `Meta` type from an internal package, inline it. The output must be copy-pasteable into a `.d.ts` file and compile on its own.

Compute a SHA-256 hash of the final type block string. Store this as `typeHash` in the manifest for change detection.

## Step 3 — Skill Generation

For each discovered class, read the appropriate template from `templates/` and fill in all fields.

### Field Derivation Reference

| Field                 | Source                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `skillName`           | Class name → kebab-case, strip suffix. `EntryBeforeCreateEventHandler` → `entry-before-create` |
| `category`            | Import path mapping (see above)                                                                |
| `abstractionType`     | Class suffix: `EventHandler` or `UseCase`                                                      |
| `className`           | Exported class name as-is                                                                      |
| `importPath`          | The `webiny/...` import path                                                                   |
| `humanName`           | Entity + Timing + Operation, title case. `Entry Before Create`                                 |
| `description`         | From description templates (see below)                                                         |
| `firesWhen`           | Natural language: `"Before a new entry is saved"`                                              |
| `timing`              | `before` or `after`                                                                            |
| `typeBlock`           | Extracted types from Step 2                                                                    |
| `exampleCode`         | Stamped from the template's example section                                                    |
| `registrationSnippet` | From registration config (see below)                                                           |
| `notes`               | From notes config (see below)                                                                  |
| `relatedSkills`       | Auto-linked (see below)                                                                        |

### Description Templates

Generate descriptions by parsing the class name into entity + timing + operation:

**EventHandler (before):**

> Intercept {entity} {operation} before it is persisted. Validate fields, compute derived values, or reject the operation.

**EventHandler (after):**

> React after {entity} is {pastTenseOperation}. Side effects: notifications, external sync, cache invalidation.

**UseCase:**

> {operation} {entity}. Programmatically invoke this use case from custom code or other extensions.

Use an **operation verb map** for correct past tense and phrasing:

```json
{
  "create": { "past": "created", "phrase": "creation" },
  "update": { "past": "updated", "phrase": "update" },
  "delete": { "past": "deleted", "phrase": "deletion" },
  "publish": { "past": "published", "phrase": "publishing" },
  "unpublish": { "past": "unpublished", "phrase": "unpublishing" },
  "republish": { "past": "republished", "phrase": "republishing" },
  "move": { "past": "moved", "phrase": "move" },
  "duplicate": { "past": "duplicated", "phrase": "duplication" },
  "install": { "past": "installed", "phrase": "installation" },
  "restore": { "past": "restored from bin", "phrase": "restoration from bin" }
}
```

### Notes Config

Select notes based on abstraction type and timing:

**EventHandler — before:**

- Handler fires for ALL models — always filter by `modelId`
- `payload.values` is mutable — write to it to set computed fields
- Throw an error to reject the operation

**EventHandler — after:**

- Handler fires for ALL models — always filter by `modelId`
- `payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

**UseCase:**

- Returns a result — check the return type in the Types section
- Can be invoked from event handlers, other use cases, or custom API resolvers
- Inject via dependency injection — see `dependency-injection` skill

### Registration Config

Register the extension implementation in the `webiny.config.tsx` registry:

```tsx
<Api.Extension src={"@/extensions/{{fileName}}.ts"} />
```

### Related Skills Auto-Linking

**EventHandlers:**

- Same entity, opposite timing: `entry-before-create` → `entry-after-create`
- Same entity, adjacent operation: `entry-before-create` → `entry-before-update`
- Always: `dependency-injection`
- CMS entity handlers: `content-models`

**UseCases:**

- Related use cases in the same domain (same entity)
- `dependency-injection`

## Step 4 — Index Generation

Build `skill-index.json` using the template in `templates/skill-index.json.hbs`.

Aggregate all skills (generated + hand-authored). Group by category, then by entity within each category. Include `name`, `type`, and `description` for each skill.

The MCP server reads this file to serve `list_webiny_skills`. It is **never returned directly** to agents — the server serializes it to markdown at response time.

### Index Markdown Format

**Tier 1** (`list_webiny_skills()` with no params) — category summary:

```markdown
# Webiny Skills

## cms (Headless CMS) — 36 skills

Entry, model, and group lifecycle hooks and use cases.

## security (Security & Auth) — 14 skills

Authentication, API keys, roles, and user management.
```

**Tier 2** (`list_webiny_skills({ category: "cms" })`) — skills grouped by entity:

```markdown
# CMS Skills

## Entry

- **entry-before-create** (EventHandler) — Intercept new entries before save. Validate, compute, reject.
- **entry-after-create** (EventHandler) — React after entry creation. Notifications, sync, workflows.
```

## Step 5 — Manifest Generation

Write `skill.manifest.json` for each generated skill using `templates/skill.manifest.json.hbs`. See `references/architecture.md` for the full manifest schema.

Key fields: `skill`, `generated`, `version`, `className`, `importPath`, `sources`, `typeHash`, `generatedFromRef`.

`generatedFromRef` is the git commit hash at generation time — obtain with `git rev-parse HEAD`. It enables precise diffing of source changes between regenerations.

For hand-authored skills, manifests are written manually with `"generated": false`.

## Output Folder Structure

```
skills/
├── cms/
│   ├── entry-before-create/
│   │   ├── SKILL.md
│   │   └── skill.manifest.json
│   ├── entry-after-create/
│   │   └── ...
│   └── ...
├── security/
│   └── ...
├── website-builder/
│   └── ...
├── tenancy/
│   └── ...
├── system/
│   └── ...
├── common/                       ← hand-authored, not generated
│   ├── dependency-injection/
│   │   └── ...
│   └── ...
└── skill-index.json
```

## Running the Pipeline

```bash
# Full regeneration
yarn generate-skills

# Check which skills are outdated (compares type hashes)
yarn generate-skills --check

# Regenerate only skills affected by changes since a git ref
yarn generate-skills --since v5.42.0
```

## Release Workflow

1. **Detect:** `yarn generate-skills --check --since <last-release-tag>` — lists skills with changed source files
2. **Regenerate:** `yarn generate-skills --since <last-release-tag>` — re-extracts types, regenerates affected skills
3. **Review hand-authored:** Pipeline flags `common/` skills whose `relatedPackages` had changes
4. **Commit:** `git add skills/ && git commit -m "chore: regenerate skills for <version>"`
5. Skills ship with the `webiny` npm package, which includes the MCP server

## Adding a New Abstraction Type

To support a new pattern (e.g., classes ending in `Middleware`):

1. Add the suffix to the discovery scan in Step 1
2. Create a new template: `templates/middleware-skill.md.hbs`
3. Add a notes config entry for the new type
4. Add description templates for the new type
5. Run the pipeline — new skills appear automatically

No changes to the pipeline core or the MCP tools.
