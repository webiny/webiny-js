# AI Models

This directory contains the AI SDK factory implementations that define which models are available in Webiny's AI Powerups.

## Selection criteria

Every model listed in a factory **must** support:

- **Tool/function calling** — AI Powerups relies on tools for structured output (content generation, entry comparison, image enrichment, etc.). Models without tool support will break these features at runtime.
- **Chat/text generation** — only conversational models are listed; embedding, image-generation, TTS, and other specialized models are excluded.
- **General availability** — preview-only models are excluded unless they fill a gap no GA model covers.

Models are ordered newest-first within each factory. Deprecated models that still work via the provider API are kept at the bottom of the list so existing user presets don't break.

## Model lifecycle

Each model entry in `IAiSdkModel` supports two optional `Date` fields:

- **`deprecated`** — the date the provider officially deprecated the model. The model still works but is no longer recommended.
- **`endOfLife`** — the date the provider will shut down the model. After this date, API requests to the model will fail.

Set these fields when the provider announces deprecation or end-of-life dates. The UI can use them to warn users about upcoming shutdowns or steer them toward replacements.

When a model reaches its `endOfLife` date, remove it from the factory in the next release — keeping it would cause runtime failures.

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
2. Add an entry to the `*_MODELS` array in the corresponding factory file. The `id` must match the provider's API model ID exactly.
3. If the model has known deprecation or end-of-life dates, set `deprecated` and/or `endOfLife` as `new Date("YYYY-MM-DD")`.
4. Update the table in this file.

## Adding a new provider

1. Create a new `<Provider>SdkFactory.ts` implementing `AiSdkFactory`.
2. Add the `@ai-sdk/<provider>` dependency via `yarn add` in `packages/api-core`.
3. Register the factory in `feature.ts`.
4. Update this file.

## Updating models

Check the provider docs periodically and update the lists:

- **New models**: add to the top of the active section.
- **Deprecated models**: set `deprecated` and `endOfLife` dates, move to the bottom of the array.
- **End-of-life reached**: remove from the factory. Keeping a dead model causes runtime failures.
- **Never remove a model before its end-of-life date** — users may have presets referencing it, and removing it breaks `ProvidersHandler` validation on save.

Last updated: September 2026.
