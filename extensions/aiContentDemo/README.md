# AI content demo — "Generate AI summary" bulk action

A second bulk-action / background-task demo, this time with **AI**. It generates a short
marketing summary for each selected Product — as a background task — by delegating to
**AI Power Ups** instead of hardcoding a prompt/provider.

## Why via AI Power Ups (not a raw AI call)

`processData` calls `CmsGenerateEntryContentUseCase` (exposed at `webiny/api/ai-powerups`).
That use case:

- uses the **provider the user configured** in AI Power Ups settings (no model/API-key
  handling in our code),
- applies an optional **Writer Persona** — the user's own tone/instructions, configured
  once — when you pass `writerPersonaId`,
- pulls project + file context and returns AI-generated entry values.

So the story is "configure your AI instructions once → apply them across many entries via
a background task", rather than re-implementing AI plumbing per feature. Compare with
`@webiny/ai-powerups` `AiImageEnrichmentTask`, which makes a direct, hardcoded-prompt call.

## Files

| File                                 | Role                                                               |
| ------------------------------------ | ------------------------------------------------------------------ |
| `AiContentDemo.tsx`                  | Full-stack entry — registers the API + Admin extensions.           |
| `api/GenerateAiSummaryBulkAction.ts` | Bulk action; `processData` calls `CmsGenerateEntryContentUseCase`. |
| `admin/Extension.tsx`                | Registers the button on the Products list.                         |
| `admin/GenerateAiSummaryAction.tsx`  | The bulk-action button.                                            |

Model fields (on `../models/ProductModel.ts`): `aiSummary` (the generated text) and
`aiSummarized` (boolean convergence flag — `loadData` filters `values.aiSummarized_not: true`).

## Requirements

The button is a dropdown of the AI Power Ups contexts configured in settings, fetched via
`GetSettingsFeature` (exposed at `webiny/admin/ai-powerups`), grouped into:

- **Projects** — a bundled prompting context (its own instructions + default personas + files)
- **Writer Personas** — how the text should be written (tone)
- **Reader Personas** — who it's written for (audience)

Pick one (or "Default" for none); the chosen `projectId` / `writerPersonaId` /
`readerPersonaId` is forwarded through the action `data` to the backend, which passes it
to `CmsGenerateEntryContentUseCase`.

AI Power Ups must be configured in the target environment (a provider added in its
settings). Without it, generation fails with: "No AI provider configured…". To apply a
Writer Persona, pass its id via the action `data` (`writerPersonaId`) — see the commented
line in `GenerateAiSummaryAction.tsx`.

## Note

The use case returns AI-generated entry values as a JSON string; we parse it and take the
`aiSummary` field. If the model returns nothing usable, the entry is still marked
`aiSummarized` (and logged) so the task converges instead of looping.
