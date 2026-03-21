# MCP Skills Architecture

## Overview

This document describes the architecture for auto-generating, serving, and maintaining MCP skills for the Webiny platform. Skills teach AI agents how to use Webiny's public API — event handlers, use cases, and other extension points — to build extensions and customize the system.

The `webiny` npm package is the single source of truth. It exports the entire public API surface. A generator pipeline scans this package, discovers all exported abstractions (classes ending in `EventHandler`, `UseCase`, and any future patterns), extracts their TypeScript types, and produces one skill per abstraction. These skills are served to agents via two MCP tools.

### Design Principles

- **1:1 mapping**: Every exported public abstraction = one skill. No human judgment about grouping or merging.
- **Fully automated generation**: Skills are produced by a deterministic pipeline. No hand-authoring for EventHandler or UseCase skills.
- **Types embedded in skills**: Each skill is small enough (~60-120 lines) that its TypeScript types fit inline. No separate type files, no `include_types` parameter.
- **Two-tier discovery**: Agents narrow scope before loading full skill content, minimizing context usage.
- **Traceable to source**: Every skill has a manifest linking it back to the exact source files, enabling automated detection of what needs updating at release time.

---

## Skill Categories

### Auto-Generated Skills (from `webiny` package exports)

These are produced entirely by the generator pipeline. Each maps 1:1 to an exported abstraction.

- **EventHandler skills** — one per class ending in `EventHandler`. Examples: `EntryBeforeCreateEventHandler`, `ApiKeyAfterUpdateEventHandler`, `PageBeforePublishEventHandler`.
- **UseCase skills** — one per class ending in `UseCase`. Same pattern: discover, extract types, generate skill.
- **Future patterns** — the pipeline should be extensible to handle new suffixes/patterns as the platform evolves.

### Hand-Authored Skills (common/shared patterns)

These cover cross-cutting concerns that don't map to a single exported class:

- `dependency-injection` — how to inject Logger, BuildParams, and other services
- `custom-api` — building custom GraphQL APIs
- `content-models` — defining CMS models and field types
- Other general guides

These change rarely and are maintained manually. They are flagged in the manifest with `"generated": false` so the pipeline skips them during regeneration.

---

## Folder Structure

```
skills/
├── cms/
│   ├── entry-before-create/
│   │   ├── SKILL.md              ← generated
│   │   └── skill.manifest.json   ← generated
│   ├── entry-after-create/
│   │   ├── SKILL.md
│   │   └── skill.manifest.json
│   ├── entry-before-update/
│   │   └── ...
│   ├── content-model-before-create/
│   │   └── ...
│   ├── group-before-create/
│   │   └── ...
│   └── ...
├── security/
│   ├── api-key-before-create/
│   │   └── ...
│   ├── api-key-after-update/
│   │   └── ...
│   ├── role-before-create/
│   │   └── ...
│   ├── user-before-create/
│   │   └── ...
│   ├── before-authentication/
│   │   └── ...
│   └── ...
├── website-builder/
│   ├── page-before-create/
│   │   └── ...
│   ├── redirect-before-create/
│   │   └── ...
│   └── ...
├── tenancy/
│   ├── tenant-before-create/
│   │   └── ...
│   └── ...
├── system/
│   ├── system-installed/
│   │   └── ...
│   └── ...
├── common/
│   ├── dependency-injection/
│   │   ├── SKILL.md              ← hand-authored
│   │   └── skill.manifest.json   ← generated: false
│   ├── custom-api/
│   │   └── ...
│   └── ...
└── skill-index.json              ← generated, powers list_webiny_skills
```

The folder hierarchy is for human maintainers. The MCP server reads `skill-index.json` and individual skill files — it doesn't care about folder nesting.

---

## MCP Tools

### Response Format

All MCP tool responses are returned as **markdown**, not JSON. The consuming agent is an LLM performing a reading comprehension task — markdown is naturally parseable, scannable, and doesn't waste tokens on structural syntax. The MCP server stores index data internally as structured objects but serializes to markdown before returning.

### `list_webiny_skills`

Two-tier discovery to minimize context usage.

**Tier 1 — No parameters:** Returns category summary only.

```
list_webiny_skills()
```

Response:
```markdown
# Webiny Skills

## cms (Headless CMS) — 36 skills
Entry, model, and group lifecycle hooks and use cases.

## security (Security & Auth) — 14 skills
Authentication, API keys, roles, and user management.

## website-builder (Website Builder) — 24 skills
Page and redirect lifecycle hooks.

## tenancy (Tenancy) — 7 skills
Tenant lifecycle and installation hooks.

## system (System) — 1 skill
System installation hook.

## common (Common Patterns) — 5 skills
Dependency injection, custom APIs, and shared patterns.
```

**Tier 2 — With `category` parameter:** Returns all skills in that category with short descriptions, grouped by entity.

```
list_webiny_skills({ category: "cms" })
```

Response:
```markdown
# CMS Skills

## Entry

- **entry-before-create** (EventHandler) — Intercept new entries before save. Validate, compute, reject.
- **entry-after-create** (EventHandler) — React after entry creation. Notifications, sync, workflows.
- **entry-before-update** (EventHandler) — Intercept updates before save. Re-validate, transform.
- **entry-after-update** (EventHandler) — React after entry update. Sync changes, trigger workflows.
- **entry-before-delete** (EventHandler) — Intercept deletion. Prevent, clean up related data.
- **entry-after-delete** (EventHandler) — React after deletion. Clean up external references.
- **entry-before-publish** (EventHandler) — Gate publishing. Validate readiness, enforce rules.
- **entry-after-publish** (EventHandler) — React after publish. Invalidate caches, notify subscribers.

## Model

- **model-before-create** (EventHandler) — Intercept model creation. Validate schema, enforce naming.
- **model-after-create** (EventHandler) — React after model creation. Provision resources, log.
- **model-before-update** (EventHandler) — Intercept model updates. Validate schema changes.
- **model-after-update** (EventHandler) — React after model update.

## Group

- **group-before-create** (EventHandler) — Intercept group creation. Validate, enforce rules.
- **group-after-create** (EventHandler) — React after group creation.
```

Entity grouping (the `## Entry`, `## Model`, `## Group` headings) is derived from the class name prefix and gives the agent an immediate visual structure without requiring sub-category tool calls.

### `get_webiny_skill`

Returns the full skill content (markdown) for a single skill.

```
get_webiny_skill({ name: "entry-before-create" })
```

Response: The full SKILL.md content, including embedded TypeScript types, canonical example, registration instructions, and related skills.

---

## Skill Template

Every auto-generated skill follows this template. All fields are derived mechanically from the source code + a config map.

```markdown
---
name: {{skillName}}
category: {{category}}
type: {{abstractionType}}
class: {{className}}
import: {{importPath}}
description: {{description}}
---

# {{humanName}}

{{description}}

**Import:** `import { {{className}} } from "{{importPath}}";`
**Fires:** {{firesWhen}}
**Timing:** {{timing}}

## Types

\`\`\`typescript
{{typeBlock}}
\`\`\`

## Example

\`\`\`typescript
{{exampleCode}}
\`\`\`

## Registration

\`\`\`tsx
{{registrationSnippet}}
\`\`\`

## Notes
{{#each notes}}
- {{this}}
{{/each}}

## Related Skills
{{#each relatedSkills}}
- `{{this.name}}` — {{this.reason}}
{{/each}}
```

### Template Input Derivation

Each template field is derived as follows:

| Field | Derived From |
|---|---|
| `skillName` | Class name → kebab-case, strip "EventHandler"/"UseCase" suffix. `EntryBeforeCreateEventHandler` → `entry-before-create` |
| `category` | Import path mapping. `webiny/api/cms/entry` → `cms`, `webiny/api/security/api-key` → `security`, `webiny/api/website-builder/page` → `website-builder` |
| `abstractionType` | Class suffix. `*EventHandler` → `"EventHandler"`, `*UseCase` → `"UseCase"` |
| `className` | The exported class name as-is |
| `importPath` | The `webiny/...` import path |
| `description` | Generated from naming convention (see Description Generation below) |
| `firesWhen` | Parsed from class name: entity + timing + operation |
| `timing` | `"before"` or `"after"` (for EventHandlers) |
| `typeBlock` | Extracted via TS compiler API from the exported class |
| `exampleCode` | Stamped from a per-type code template |
| `registrationSnippet` | Determined by category/type (e.g., `<Api.Extension>` for CMS) |
| `notes` | Selected from a timing-based config map |
| `relatedSkills` | Auto-linked: same entity + opposite timing, plus `dependency-injection` |

### Description Generation

Descriptions are generated by parsing the class name into components and filling a template:

```
Class: EntryBeforeCreateEventHandler
  → entity: "entry"
  → timing: "before"
  → operation: "create"

Template (before): "Intercept {entity} {operation} before it is saved.
                    Validate, compute derived fields, or reject."

Template (after):  "React after {entity} is {operation}d.
                    Side effects, notifications, external sync."
```

A config map holds entity-specific phrasing where the default template doesn't read well (e.g., "publish" → "published" not "publishd"). This map is small and stable.

### Notes Config Map

```json
{
  "EventHandler": {
    "before": [
      "Handler fires for ALL models — always filter by `modelId`",
      "`payload.values` is mutable — write to it to set computed fields",
      "Throw an error to reject the operation"
    ],
    "after": [
      "Handler fires for ALL models — always filter by `modelId`",
      "`payload` reflects the persisted state — do not mutate",
      "Use for side effects: notifications, sync, cache invalidation"
    ]
  },
  "UseCase": {
    ...
  }
}
```

Notes specific to certain entities or operations can override the defaults via the config map.

### Related Skills Auto-Linking

For EventHandlers:
- Same entity, opposite timing: `entry-before-create` links to `entry-after-create`
- Same entity, adjacent operations: `entry-before-create` links to `entry-before-update`
- Always link to `dependency-injection` (since all handlers use DI)
- Link to `content-models` for CMS entity handlers

For UseCases:
- Related use cases in the same domain
- `dependency-injection` if the use case accepts injected services

---

## Manifest File

Every skill (generated or hand-authored) has a `skill.manifest.json`:

```json
{
  "skill": "entry-before-create",
  "generated": true,
  "version": "5.42.0",
  "generatedAt": "2026-03-21T10:00:00Z",
  "abstractionType": "EventHandler",
  "className": "EntryBeforeCreateEventHandler",
  "importPath": "webiny/api/cms/entry",
  "sources": [
    {
      "package": "@webiny/api-headless-cms",
      "files": [
        "src/crud/entry/lifecycle/EntryBeforeCreateEventHandler.ts",
        "src/crud/entry/lifecycle/types.ts"
      ]
    }
  ],
  "typeHash": "a1b2c3d4e5f6...",
  "generatedFromRef": "a1b2c3d4e5f67890abcdef..."
}
```

| Field | Purpose |
|---|---|
| `generated` | `true` for auto-generated, `false` for hand-authored. Pipeline skips `false`. |
| `version` | Platform version this skill was generated from. |
| `sources` | Exact internal package files used to produce this skill. |
| `typeHash` | Hash of the extracted type block. Quick check: if hash unchanged, skill is up to date. |
| `generatedFromRef` | Git commit hash (`git rev-parse HEAD`) of the source repo at generation time. Enables precise diffing of what changed between regenerations. |

For hand-authored skills:
```json
{
  "skill": "dependency-injection",
  "generated": false,
  "version": "5.42.0",
  "lastReviewedAt": "2026-03-21T10:00:00Z",
  "relatedPackages": ["@webiny/api-serverless-cms"]
}
```

---

## Skill Index

The MCP server needs a structured internal representation to power `list_webiny_skills`. This is stored as `skill-index.json` but **never returned directly to the agent** — it is serialized to markdown at response time.

```json
{
  "version": "5.42.0",
  "generatedAt": "2026-03-21T10:00:00Z",
  "categories": [
    {
      "id": "cms",
      "label": "Headless CMS",
      "description": "Entry, model, and group lifecycle hooks and use cases.",
      "entities": [
        {
          "name": "Entry",
          "skills": [
            {
              "name": "entry-before-create",
              "type": "EventHandler",
              "description": "Intercept new entries before save. Validate, compute, reject."
            }
          ]
        },
        {
          "name": "Model",
          "skills": [...]
        }
      ]
    },
    {
      "id": "website-builder",
      "label": "Website Builder",
      "description": "Page and redirect lifecycle hooks.",
      "entities": [
        {
          "name": "Page",
          "skills": [...]
        },
        {
          "name": "Redirect",
          "skills": [...]
        }
      ]
    }
  ]
}
```

The `entities` grouping is derived from the class name prefix during index generation. It structures the Tier 2 markdown response into scannable sections.

---

## Generator Pipeline

### Inputs

- The `webiny` npm package source (or built output) in the monorepo
- Template files for each abstraction type (EventHandler, UseCase, etc.)
- Config maps (description templates, notes, registration snippets, category mappings)

### Steps

#### Step 1 — Discovery

Scan the `webiny` package exports. Find all classes matching known patterns:
- `*EventHandler` — event lifecycle hooks
- `*UseCase` — use case abstractions
- (extensible to future patterns)

For each discovered class, record:
- Class name
- Export path (the `webiny/...` import path)
- Abstraction type (EventHandler, UseCase, etc.)

#### Step 2 — Type Extraction

For each discovered class, use the TypeScript compiler API to:
1. Resolve the class's public interface (`.Interface` namespace member)
2. Resolve the event/params type (`.Event` or `.Params` namespace member)
3. Resolve the `createImplementation` signature
4. Flatten all referenced types into a self-contained block (no imports from internal packages)
5. Strip internal generics, utility types, and implementation details
6. Compute a hash of the resulting type block

#### Step 3 — Skill Generation

For each discovered class:
1. Parse the class name into components (entity, timing, operation)
2. Look up category from import path
3. Generate description from naming convention + config map
4. Stamp the skill template with: class name, import path, types, example code, registration snippet, notes, related skills
5. Write `SKILL.md` to the appropriate folder
6. Write `skill.manifest.json` with source file references and type hash

#### Step 4 — Index Generation

Aggregate all skills (generated + hand-authored) into `skill-index.json`:
1. Group by category
2. Include name, type, and description for each skill
3. Write the index file

### Running the Pipeline

```bash
# Full regeneration
yarn generate-skills

# Check which skills are outdated (compares type hashes)
yarn generate-skills --check

# Regenerate only skills affected by changes since a git ref
yarn generate-skills --since v5.42.0
```

---

## Release Workflow

When preparing a new platform release:

### 1. Detect Changes

```bash
# Find which internal packages changed since last release
git diff --name-only v5.42.0..HEAD -- packages/

# Cross-reference against skill manifests to find affected skills
yarn generate-skills --check --since v5.42.0
```

Output: list of skills whose source files changed.

### 2. Regenerate Affected Skills

```bash
yarn generate-skills --since v5.42.0
```

This re-extracts types and regenerates only the affected skills. If a handler was added, a new skill appears. If a handler was removed, its skill is flagged for deletion. If types changed, the skill is regenerated with updated types.

### 3. Review Hand-Authored Skills

The pipeline flags hand-authored skills whose `relatedPackages` had changes. These need manual review. Expected to be rare.

### 4. Commit and Publish

```bash
git add skills/
git commit -m "chore: regenerate skills for v5.43.0"
```

The updated skills ship with the next `webiny` npm package release, which includes the MCP server.

---

## Example Generated Skill

For `EntryBeforeCreateEventHandler` from `webiny/api/cms/entry`:

```markdown
---
name: entry-before-create
category: cms
type: EventHandler
class: EntryBeforeCreateEventHandler
import: webiny/api/cms/entry
description: >
  Intercept new CMS entries before they are saved.
  Validate fields, compute derived values, or reject invalid data.
---

# Entry Before Create

Intercept new CMS entries before they are saved.
Validate fields, compute derived values, or reject invalid data.

**Import:** `import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before a new entry is saved
**Timing:** Before

## Types

\`\`\`typescript
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";

// Handler.Event
interface Event {
  modelId: string;
  payload: {
    id: string;
    entryId: string;
    values: Record<string, unknown>;
    meta: {
      status: "draft";
      version: 1;
      locked: boolean;
    };
  };
}

// Handler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// Handler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
\`\`\`

## Example

\`\`\`typescript
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

class ValidateEmailHook implements Handler.Interface {
  constructor(private logger: Logger.Interface) {}

  async handle(event: Handler.Event): Promise<void> {
    if (event.modelId !== "contactSubmission") {
      return;
    }

    const email = event.payload.values?.email as string;
    if (!email?.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Compute a derived field before save
    if (!event.payload.values) {
      event.payload.values = {};
    }
    event.payload.values.emailDomain = email.split("@")[1]?.toLowerCase();

    this.logger.info(`Validated contact submission email: ${email}`);
  }
}

export default Handler.createImplementation({
  implementation: ValidateEmailHook,
  dependencies: [Logger]
});
\`\`\`

## Registration

\`\`\`tsx
<Api.Extension src={"/extensions/validateEmailHook.ts"} />
\`\`\`

## Notes

- Handler fires for ALL models — always filter by `modelId`
- `payload.values` is mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `entry-after-create` — react after entry creation (notifications, sync)
- `entry-before-update` — same validation pattern for updates
- `dependency-injection` — inject Logger, BuildParams, and other services
- `content-models` — define the models your hook targets
```

---

## Open Questions

### UseCase Skill Shape

The EventHandler template is well-defined from the existing skill examples. UseCases likely have a different structure: parameters instead of events, return values, different registration mechanism. The generator needs a separate template for UseCases. **Action:** define the UseCase template once the first UseCase skills are prototyped.

### Registration Snippet Variations

Different categories may use different registration JSX elements:
- CMS: `<Api.Extension src={...} />`
- Security API Keys: `<Security.ApiKey.AfterUpdate src={...} />`
- Others: TBD

The config map needs a `registrationSnippet` entry per category (or per class, if it varies within a category). **Action:** catalog all registration patterns during the first full pipeline run.

### Future Abstraction Types

The pipeline should be designed so that adding a new pattern (e.g., classes ending in `Middleware` or `Plugin`) requires only:
1. A new entry in the discovery config (suffix to scan for)
2. A new template
3. A new notes config map entry

No changes to the pipeline core.

### Context Budget

With 70-80 skills, Tier 2 responses (`list_webiny_skills({ category })`) could be large for categories like CMS. The entity grouping within categories helps — the agent can scan headings and skip irrelevant entities. Monitor the token count of Tier 2 responses. If a category exceeds ~1500 tokens in its markdown response, consider splitting into sub-categories (e.g., `cms-entry`, `cms-model`, `cms-group`). The entity field in the index already provides the seam for this split — it would be a mechanical change to the index generator with no impact on the skills themselves.
```
