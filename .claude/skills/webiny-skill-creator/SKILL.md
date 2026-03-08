---
name: webiny-skill-creator
description: >
  Generate, refresh, and maintain Webiny MCP server skills from source documentation and codebase.
  Use this skill when you need to create new Webiny skills, update existing skills after framework
  changes, regenerate the entire skill library, or create a skill for a specific Webiny feature.
  Trigger this whenever someone says "create a skill", "update skills", "refresh skills",
  "add a new skill for X", or "regenerate the skill library". This is the meta-skill that
  produces all other Webiny MCP skills.
---

# Webiny Skill Creator

This skill generates and maintains the set of skills served by the Webiny MCP server. It operates in two modes:

1. **Full regeneration** -- Reads all source documentation and the codebase, then generates/updates the complete skill library.
2. **Single skill creation** -- Creates or updates one skill for a specific Webiny feature.

## Skill Output Format

Every skill lives in its own folder as `<skill-name>/SKILL.md` with YAML frontmatter. The MCP server recursively scans for `SKILL.md` files and auto-generates the catalog from front-matter metadata -- no README index is needed.

```
webiny/my-skills/
├── <skill-name>/
│   └── SKILL.md
├── <skill-name>/
│   └── SKILL.md
└── ...
```

### Skill File Structure

Each `<skill-name>/SKILL.md` file follows this template:

```markdown
---
name: webiny-<topic>
description: >
  What this skill covers and when to use it.
  Be specific about trigger phrases and developer intents.
  Err on the side of being "pushy" -- describe scenarios broadly
  so the MCP server surfaces this skill when relevant.
---

# Title

## TL;DR

One paragraph actionable summary.

## Pattern / Core Concept

The main code pattern with a generic template.

## Reference Tables

Tables for methods, properties, types, imports.

## Full Examples

2-3 complete, working code examples showing real use cases.

## Quick Reference

Import paths, interfaces, registration, deploy commands.

## Related Skills

Links to other skills that complement this one.
```

### Writing Guidelines

These guidelines ensure skills are effective when served by the MCP server to AI agents:

1. **TL;DR first** -- Every skill starts with a one-paragraph actionable summary. An agent should be able to read just this and know if the skill is relevant.

2. **Generic pattern before examples** -- Show the abstract pattern template first, then concrete examples. This helps agents generalize rather than copy-paste.

3. **Complete, working code** -- Every code block must be copy-paste ready. Include all imports, class definitions, and export statements. Never show partial snippets that require guessing.

4. **Reference tables for APIs** -- Use markdown tables for method signatures, field types, validators, injectable services, etc. Tables are dense and scannable.

5. **Exact import paths** -- Always show the full import path. Webiny uses feature-based imports (e.g., `"webiny/api/cms/model"` not `"@webiny/api-headless-cms"`). Getting the import wrong breaks everything.

6. **The universal DI pattern** -- Every API extension uses `createImplementation({ implementation, dependencies })`. Reinforce this in every skill that covers an API extension type.

7. **Registration in webiny.config.tsx** -- Always show how to register the extension. Include the JSX element and the `src` path convention.

8. **Deploy command** -- Always end with which deploy command to run (`yarn webiny deploy api`, `admin`, or `core`).

9. **Related skills** -- Cross-link to complementary skills. Developers rarely need just one skill.

10. **Description frontmatter** -- The `description` field is the primary trigger mechanism. Include:
    - What the skill does
    - Specific developer intents that should trigger it
    - Keywords and phrases developers might use
    - Be slightly aggressive about claiming relevance

## Source Documentation

When generating or updating skills, read from these sources in priority order:

### 1. Existing Skills (`<root>/packages/mcp/src/skills/`)

Read the current skills first to understand what exists and what needs updating.

### 2. Learn Webiny Lessons (`learn-webiny/content/lessons/`)

The tutorial content organized by topic:

| Directory                 | Topics Covered                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `foundation/`             | Webiny overview, framework, apps, multi-tenancy, infrastructure                        |
| `developing-with-webiny/` | Project structure, extensions, SDK overview, local dev, debugging, white-labeling      |
| `headless-cms/`           | Content models, versioning, lifecycle events, reading/writing data, list customization |
| `website-builder/`        | Setup, editor components, theming, CMS integration                                     |
| `getting-started/`        | Installation, CLI overview, deployment                                                 |

### 3. Legacy Skills (`skills-bak/`)

The previous generation of skills. Good reference for structure and patterns but may have outdated imports or APIs.

### 4. Webiny Codebase (`webiny/`)

The actual development instance:

| Path                | What to Look At                                                |
| ------------------- | -------------------------------------------------------------- |
| `webiny.config.tsx` | Real extension registration examples                           |
| `extensions/`       | Working extension implementations                              |
| `ai-context/`       | Core features reference with import paths and type definitions |
| `packages/`         | Package source code for verifying APIs                         |

### 5. Webiny AI Context (`webiny/ai-context/`)

Contains `core-features-reference.md` with verified import paths and type definitions for:

- Core features (TenantContext, IdentityContext, EventPublisher, etc.)
- Headless CMS features (content entries, models, repositories)
- Tenancy features (CRUD operations)

This is the most reliable source for import paths and interfaces.

## Full Regeneration Workflow

When asked to regenerate all skills:

1. **Inventory current skills** -- Read `webiny/my-skills/` to see what exists.

2. **Read source documentation** -- Use subagents to read in parallel:
   - All MDX files in `learn-webiny/content/lessons/` (exclude archived)
   - All files in `skills-bak/`
   - Key files: `webiny/webiny.config.tsx`, `webiny/ai-context/core-features-reference.md`
   - Extension examples in `webiny/extensions/`

3. **Identify gaps** -- Compare source content against existing skills. Look for:
   - New features not yet covered by skills
   - Outdated import paths or APIs
   - Missing code examples
   - New extension types or patterns

4. **Generate/update skills** -- Write each skill following the format above. For each skill:
   - Read the corresponding source files
   - Extract all code patterns, imports, and APIs
   - Write complete, working examples
   - Cross-reference import paths against `ai-context/core-features-reference.md`
   - Add related skills links

5. **Verify consistency** -- Check that:
   - All import paths are consistent across skills
   - The DI pattern is shown correctly everywhere
   - Registration examples match `webiny.config.tsx` conventions
   - Deploy commands are correct for each extension type

## Single Skill Creation Workflow

When asked to create a skill for a specific feature:

1. **Understand the feature** -- Ask the developer:
   - What Webiny feature does this cover?
   - What should a developer be able to do after reading this skill?
   - Are there existing extensions or code examples?

2. **Research** -- Read relevant source files:
   - The feature's lesson in `learn-webiny/content/lessons/`
   - Any related files in `skills-bak/`
   - Actual implementation code in `webiny/extensions/` or `webiny/packages/`
   - Import paths from `webiny/ai-context/core-features-reference.md`

3. **Draft the skill** -- Create `<skill-name>/SKILL.md` following the structure above.

4. **Review with developer** -- Present the skill for feedback before finalizing.

## Current Skill Library

The following skills should exist in `webiny/my-skills/`:

| Skill Folder                     | Covers                                                    |
| -------------------------------- | --------------------------------------------------------- |
| `project-structure/SKILL.md`     | Project layout, webiny.config.tsx, extension registration |
| `content-models/SKILL.md`        | ModelFactory, fields, validators, layout                  |
| `custom-graphql-api/SKILL.md`    | GraphQLSchemaFactory, resolvers, DI                       |
| `lifecycle-events/SKILL.md`      | CMS entry hooks, security events                          |
| `admin-ui-extensions/SKILL.md`   | White-labeling, custom columns, forms, Lexical            |
| `infrastructure-extensions/SKILL.md` | Pulumi handlers, declarative infra components         |
| `cli-extensions/SKILL.md`        | CliCommandFactory, custom CLI commands                    |
| `dependency-injection/SKILL.md`  | Universal DI pattern, injectable services                 |
| `webiny-sdk/SKILL.md`            | External app integration, Result pattern                  |
| `website-builder/SKILL.md`       | Editor components, theming, CMS integration               |
| `local-development/SKILL.md`     | Deploy, watch, environments, debugging                    |

### When to Add New Skills

Add a new skill when:

- A new Webiny feature is released that doesn't fit existing skills
- An existing skill grows beyond ~500 lines and should be split
- A developer asks for help with something not covered
- The `webiny/packages/` directory shows new extension types

### Naming Convention

- Folder name: `<skill-name>/` in kebab-case (e.g., `content-models/`, not `cms/`)
- Skill file: always named `SKILL.md` inside the folder
- Frontmatter `name` field: `webiny-<skill-name>` (e.g., `webiny-content-models`)
- No README index needed -- the MCP server auto-discovers skills from front-matter

## MCP Server Integration

Skills are served via the Webiny MCP server:

```json
// .mcp.json
{
  "mcpServers": {
    "webiny": {
      "command": "npx",
      "args": ["webiny", "mcp-server", "--additional-skills", "./my-skills"]
    }
  }
}
```

The MCP server exposes two tools:

- `list_webiny_skills` -- Returns all skill names and descriptions
- `get_webiny_skill` -- Returns the full content of a specific skill

Agents call `list_webiny_skills` first to find relevant skills, then `get_webiny_skill` to load the full content before writing code.

## Suggestions for MCP Server Enhancement

Beyond skills, consider these additional inputs for the MCP server to improve developer experience:

### 1. Live Schema Context

Expose the actual content models defined in the project (from `webiny.config.tsx` and `extensions/`) so agents know what models exist, their fields, and relationships without having to read source files.

### 2. Extension Registry

Provide a tool that lists all registered extensions (API, Admin, Infra, CLI) with their file paths and types. This helps agents understand what's already built.

### 3. Environment Info

Expose `yarn webiny info` output (API URLs, Admin URL, CloudFront endpoint) as an MCP tool so agents can configure SDK clients or test endpoints without running CLI commands.

### 4. GraphQL Schema Introspection

Expose the auto-generated GraphQL schema so agents can see exact query/mutation signatures, field types, and filter options for each content model.

### 5. Code Templates

Bundle scaffolding templates for common patterns (new model, new hook, new GraphQL schema, new editor component) that agents can use as starting points, reducing the chance of structural errors.

### 6. Validation Tool

An MCP tool that validates extension code before deployment -- checking import paths, DI dependency order, and webiny.config.tsx registration. Catches errors before `yarn webiny deploy`.
