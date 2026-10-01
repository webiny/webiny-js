# AI Models

This directory contains the AI SDK factory implementations that serve the models available in Webiny's AI Powerups.

## Where the model list comes from

`AiModelRegistry` takes the published catalog at `https://api.webiny.com/ai/models` (`RemoteAiModelCatalog`, overridable through `WCP_API_URL`) and intersects it with the registered SDK factories:

- A catalog provider with no SDK factory is not offered. The SDK factory is the last gate.
- For a provider that has a factory, the catalog's models and names replace the factory's own list.
- A factory the catalog doesn't know (a custom SDK) keeps its own `models`.
- If the catalog can't be loaded (timeout, error status, invalid body), every factory falls back to its own `models`.

The catalog is cached for an hour per process. A failed load is retried after a minute. The first AI call on a cold Lambda waits for the fetch. If the catalog doesn't answer within 3 seconds, the fetch is aborted and the factories' own lists are used.

So adding or deprecating a model for an existing provider is a catalog change and needs no release. The `*_MODELS` arrays below are the offline fallback; keep them roughly in sync.

The catalog response looks like this. Dates are ISO strings. `supports` is kept (`tools`, `vision`, `temperature`), and fields the schema doesn't know (`api`, other `supports` keys, ...) are dropped:

```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "models": [
        {
          "id": "o3",
          "name": "o3",
          "deprecated": "2026-06-11",
          "endOfLife": "2026-12-11",
          "supports": { "tools": true, "vision": true, "temperature": false }
        }
      ]
    }
  ]
}
```

A response that doesn't match the schema counts as a failed load, so one bad entry drops the whole catalog and every factory falls back to its own list.

`Ai.generateText()` and `Ai.streamText()` send `temperature` only to a model whose `supports.temperature` is `true`. A model that says `false`, or says nothing (no `supports`, or a factory's fallback list), gets the call without it. Several current models reject `temperature` with a 400, so callers can always pass it and leave the decision to `Ai`.

## Selection criteria

Every model in the catalog or in a factory **must** support:

- **Tool/function calling** — AI Powerups relies on tools for structured output (content generation, entry comparison, image enrichment, etc.). Models without tool support will break these features at runtime.
- **Chat/text generation** — only conversational models are listed; embedding, image-generation, TTS, and other specialized models are excluded.
- **General availability** — preview-only models are excluded unless they fill a gap no GA model covers.

Models are ordered newest-first within each factory. Deprecated models that still work via the provider API are kept at the bottom of the list so existing user presets don't break.

## Model lifecycle

Each model entry in `IAiSdkModel` supports two optional `Date` fields:

- **`deprecated`** — the date the provider officially deprecated the model. The model still works but is no longer recommended.
- **`endOfLife`** — the date the provider will shut down the model. After this date, API requests to the model will fail.

Set these fields when the provider announces deprecation or end-of-life dates. The UI can use them to warn users about upcoming shutdowns or steer them toward replacements.

When a model reaches its `endOfLife` date, remove it from the catalog, which takes effect within an hour. Remove it from the factory in the next release too, or deployments that can't reach the catalog will keep offering a model that no longer works.

## Providers

### Anthropic (`AnthropicSdkFactory.ts`)

All Anthropic models listed are **Active**. Anthropic commits to a "not sooner than" retirement date but does not deprecate models until closer to retirement.

| Model ID            | Name              | Status          | Retirement (not sooner than) |
| ------------------- | ----------------- | --------------- | ---------------------------- |
| `claude-fable-5-1`  | Claude Fable 5.1  | Active          | September 1, 2027            |
| `claude-opus-5`     | Claude Opus 5     | Active          | July 24, 2027                |
| `claude-sonnet-5`   | Claude Sonnet 5   | Active          | June 30, 2027                |
| `claude-haiku-4-5`  | Claude Haiku 4.5  | Active          | October 15, 2026             |
| `claude-fable-5`    | Claude Fable 5    | Active (legacy) | June 9, 2027                 |
| `claude-opus-4-8`   | Claude Opus 4.8   | Active (legacy) | May 28, 2027                 |
| `claude-opus-4-7`   | Claude Opus 4.7   | Active (legacy) | April 16, 2027               |
| `claude-opus-4-6`   | Claude Opus 4.6   | Active (legacy) | February 5, 2027             |
| `claude-opus-4-5`   | Claude Opus 4.5   | Active (legacy) | November 24, 2026            |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | Active (legacy) | February 17, 2027            |
| `claude-sonnet-4-5` | Claude Sonnet 4.5 | Active (legacy) | September 29, 2026           |

All Claude models support tool use. Env var fallback: `WEBINY_API_ANTHROPIC_API_KEY`.

Source: https://platform.claude.com/docs/en/about-claude/model-deprecations

### OpenAI (`OpenAiSdkFactory.ts`)

| Model ID        | Name          | Status     | Deprecated     | End of life       |
| --------------- | ------------- | ---------- | -------------- | ----------------- |
| `gpt-6-astra`   | GPT-6 Astra   | Active     | —              | —                 |
| `gpt-5.6-sol`   | GPT-5.6 Sol   | Active     | —              | —                 |
| `gpt-5.6-terra` | GPT-5.6 Terra | Active     | —              | —                 |
| `gpt-5.6-luna`  | GPT-5.6 Luna  | Active     | —              | —                 |
| `gpt-5.5`       | GPT-5.5       | Active     | —              | —                 |
| `gpt-5.5-pro`   | GPT-5.5 Pro   | Active     | —              | —                 |
| `gpt-5.4`       | GPT-5.4       | Active     | —              | —                 |
| `gpt-5.4-pro`   | GPT-5.4 Pro   | Active     | —              | —                 |
| `gpt-5.4-mini`  | GPT-5.4 Mini  | Active     | —              | —                 |
| `gpt-5.4-nano`  | GPT-5.4 Nano  | Active     | —              | —                 |
| `gpt-5.2`       | GPT-5.2       | Active     | —              | —                 |
| `gpt-5.2-pro`   | GPT-5.2 Pro   | Active     | —              | —                 |
| `gpt-5`         | GPT-5         | Active     | —              | —                 |
| `gpt-5-pro`     | GPT-5 Pro     | Active     | —              | —                 |
| `gpt-5-mini`    | GPT-5 Mini    | Active     | —              | —                 |
| `gpt-5-nano`    | GPT-5 Nano    | Active     | —              | —                 |
| `gpt-4.1`       | GPT-4.1       | Active     | —              | —                 |
| `gpt-4.1-mini`  | GPT-4.1 Mini  | Active     | —              | —                 |
| `gpt-4o`        | GPT-4o        | Active     | —              | —                 |
| `gpt-4o-mini`   | GPT-4o Mini   | Active     | —              | —                 |
| `o3-pro`        | o3 Pro        | Deprecated | June 11, 2026  | December 11, 2026 |
| `o3`            | o3            | Deprecated | June 11, 2026  | December 11, 2026 |
| `gpt-4.1-nano`  | GPT-4.1 Nano  | Deprecated | April 22, 2026 | October 23, 2026  |
| `o4-mini`       | o4 Mini       | Deprecated | April 22, 2026 | October 23, 2026  |

All listed models support function calling. Env var fallback: `WEBINY_API_OPENAI_API_KEY`.

Source: https://developers.openai.com/api/docs/deprecations

### Google (`GoogleSdkFactory.ts`)

| Model ID                | Name                  | Status | End of life |
| ----------------------- | --------------------- | ------ | ----------- |
| `gemini-3.8-flash`      | Gemini 3.8 Flash      | Active | —           |
| `gemini-3.7-flash`      | Gemini 3.7 Flash      | Active | —           |
| `gemini-3.6-flash`      | Gemini 3.6 Flash      | Active | —           |
| `gemini-3.5-flash`      | Gemini 3.5 Flash      | Active | —           |
| `gemini-3.5-flash-lite` | Gemini 3.5 Flash Lite | Active | —           |
| `gemini-3.1-flash-lite` | Gemini 3.1 Flash Lite | Active | May 7, 2027 |
| `gemini-2.5-pro`        | Gemini 2.5 Pro        | Active | —           |
| `gemini-2.5-flash`      | Gemini 2.5 Flash      | Active | —           |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite | Active | —           |

All listed models support function calling. `gemini-3.1-flash-lite` does not support streaming tool call arguments, but standard (non-streaming) function calling works.

Env var fallback: `WEBINY_API_GOOGLE_API_KEY`.

Source: https://ai.google.dev/gemini-api/docs/deprecations

## Adding a new model

1. Verify the model supports tool/function calling.
2. Add it to the catalog at `https://api.webiny.com/ai/models`. That is what users see.
3. Add an entry to the `*_MODELS` array in the corresponding factory file. The `id` must match the provider's API model ID exactly.
4. If the model has known deprecation or end-of-life dates, set `deprecated` and/or `endOfLife`: ISO strings (`"YYYY-MM-DD"`) in the catalog, `new Date("YYYY-MM-DD")` in the factory.
5. Update the table in this file.

## Adding a new provider

A new provider needs a release, because the catalog can only offer providers that have an SDK factory.

1. Create a new `<Provider>SdkFactory.ts` implementing `AiSdkFactory`. Its `id` is the key the catalog matches on.
2. Add the `@ai-sdk/<provider>` dependency via `yarn add` in `packages/api-core`.
3. Register the factory in `feature.ts`.
4. Add the provider to the catalog under the same `id`. Until you do, the factory's own `models` are used.
5. Update this file.

## Updating models

Check the provider docs periodically and update the catalog first, then the factory lists:

- **New models**: add to the top of the active section.
- **Deprecated models**: set `deprecated` and `endOfLife` dates, move to the bottom of the array.
- **End-of-life reached**: remove from the catalog and the factory. Keeping a dead model causes runtime failures.
- **Never remove a model before its end-of-life date** — users may have presets referencing it, and removing it breaks `ProvidersHandler` validation on save. This matters more for the catalog than for the factory: `Ai` rejects any model the registry doesn't list, so dropping a model from the catalog breaks calls that use it in every deployment within the hour.

Last updated: October 2026.
