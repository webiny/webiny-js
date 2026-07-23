---
name: webiny-ai-powerups-content
description: >
  Generating Headless CMS entry content with AI from your own code, by delegating to the
  AI Power Ups extension instead of calling an LLM directly. Use this skill when the
  developer wants to generate/summarize/rewrite entry content programmatically (e.g. from
  a bulk action, a lifecycle hook, or a custom mutation) using the provider and the
  Writer/Reader Personas and Projects the user configured in AI Power Ups. Requires the
  AI Power Ups extension (with a provider configured) and Webiny 6.5.0 or newer.
---

# AI content generation via AI Power Ups

## TL;DR

Inject `CmsGenerateEntryContentUseCase` (from `webiny/api/ai-powerups`) and call
`execute(...)`. It uses the provider the user configured in AI Power Ups and applies an
optional **Project**, **Writer Persona**, or **Reader Persona** — so you never pick
models, decrypt API keys, or hardcode prompts. It returns the AI-generated entry values as
a JSON string; parse it and take the field(s) you want.

Prefer this over a raw `Ai.generateText` call whenever the point is "apply the user's
configured AI setup" — it composes the product with itself and is far less plumbing.

## Generate content

```typescript
import { CmsGenerateEntryContentUseCase } from "webiny/api/ai-powerups";

class MyThing {
  constructor(private generate: CmsGenerateEntryContentUseCase.Interface) {}

  async run(model, entry, ctx) {
    const result = await this.generate.execute({
      modelId: model.modelId,
      prompt: `Write a one-sentence marketing summary for "${entry.values.name}". Fill only the "aiSummary" field.`,
      // Any of these are optional; they map to what the user configured in AI Power Ups:
      projectId: ctx?.projectId, // a bundled context (instructions + files + default personas)
      writerPersonaId: ctx?.writerPersonaId, // tone
      readerPersonaId: ctx?.readerPersonaId // audience
    });
    if (result.isFail()) {
      throw result.error; // e.g. "No AI provider configured. Add a provider in AI Power Ups settings."
    }
    return result.value; // { values, telemetry }
  }
}
```

Register the dependency: `dependencies: [CmsGenerateEntryContentUseCase]`.

## Output shape — important

`result.value.values` is an **entry-shaped object keyed by the model's field ids** (the use
case is built to fill an entry from its schema). The AI decides which fields it fills, so:

- Read **only** the field(s) you want (e.g. `result.value.values.aiSummary`) — do NOT blindly
  write the whole object back, or the AI could overwrite `name`, `price`, etc.
- Type the values at the call site if you like: `execute<{ aiSummary?: string }>(...)`, which
  makes `result.value.values.aiSummary` typed (defaults to `Record<string, any>`).
- Guard for the field being absent (the model may not have filled it): fall back to `""`
  and, if you're inside a converging background task, still mark the entry done so it
  doesn't loop.

Then persist with `UpdateEntryUseCase` (values nested; `skipValidation: true` for a
targeted field write).

## Admin — list configured contexts (for a picker)

To let the user pick a Project/Persona in the Admin UI, read AI Power Ups settings with
`GetSettingsFeature` (from `webiny/admin/ai-powerups`):

```tsx
import { useFeature } from "webiny/admin";
import { GetSettingsFeature } from "webiny/admin/ai-powerups";

const { useCase: getSettings } = useFeature(GetSettingsFeature);
const settings = await getSettings.execute();
// settings.writerPersonas.presets / settings.readerPersonas.presets / settings.projects.presets
// each preset: { id, name, description, ... }
```

Forward the chosen id(s) to your backend (e.g. via a bulk action's `data`).

## Related

- `webiny-cms-bulk-actions` — the common host for this: a bulk action whose `processData`
  calls `CmsGenerateEntryContentUseCase` and writes the result, as a background task.
- `@webiny/ai-powerups`'s `AiImageEnrichmentTask` shows the alternative (raw, hardcoded
  `Ai.generateText`) — use that only when you deliberately don't want the configured setup.
