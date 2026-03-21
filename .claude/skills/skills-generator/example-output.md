# Example: Generated EventHandler Skill

This file shows what a fully rendered EventHandler skill looks like after the generator pipeline processes `EntryBeforeCreateEventHandler` from `webiny/api/cms/entry`. Use this as a reference when generating skills — the output should match this structure exactly.

---

## Generated `SKILL.md`

```markdown
---
name: entry-before-create
category: cms
type: EventHandler
class: EntryBeforeCreateEventHandler
import: webiny/api/cms/entry
description: >
  Intercept new CMS entries before they are saved.
  Validate fields, compute derived values, or reject the operation.
---

# Entry Before Create

Intercept new CMS entries before they are saved.
Validate fields, compute derived values, or reject the operation.

**Import:** `import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before a new entry is saved
**Timing:** before

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

## Generated `skill.manifest.json`

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
  "typeHash": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

---

## Index Entry (in `skill-index.json`)

This skill appears under the `cms` category, grouped with other `Entry` skills:

```json
{
  "name": "Entry",
  "skills": [
    {
      "name": "entry-before-create",
      "type": "EventHandler",
      "description": "Intercept new entries before save. Validate, compute, reject."
    },
    {
      "name": "entry-after-create",
      "type": "EventHandler",
      "description": "React after entry creation. Notifications, sync, workflows."
    }
  ]
}
```

Which the MCP server serializes to markdown as:

```markdown
## Entry

- **entry-before-create** (EventHandler) — Intercept new entries before save. Validate, compute, reject.
- **entry-after-create** (EventHandler) — React after entry creation. Notifications, sync, workflows.
```
