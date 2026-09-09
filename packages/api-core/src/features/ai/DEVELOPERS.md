# AI Models

This directory contains the AI SDK factory implementations that define which models are available in Webiny's AI Powerups.

## Selection criteria

Every model listed in a factory **must** support:

- **Tool/function calling** — AI Powerups relies on tools for structured output (content generation, entry comparison, image enrichment, etc.). Models without tool support will break these features at runtime.
- **Chat/text generation** — only conversational models are listed; embedding, image-generation, TTS, and other specialized models are excluded.
- **General availability** — preview-only models are excluded unless they fill a gap no GA model covers.

Models are ordered newest-first within each factory. Deprecated models that still work via the provider API are kept at the bottom of the list so existing user presets don't break.

## Providers

### Anthropic (`AnthropicSdkFactory.ts`)

| Model ID            | Name              | Notes                                                                 |
| ------------------- | ----------------- | --------------------------------------------------------------------- |
| `claude-fable-5-1`  | Claude Fable 5.1  | Flagship. Demanding reasoning and long-horizon agentic work.          |
| `claude-opus-5`     | Claude Opus 5     | Complex agentic coding and enterprise work.                           |
| `claude-sonnet-5`   | Claude Sonnet 5   | Best speed/intelligence balance.                                      |
| `claude-haiku-4-5`  | Claude Haiku 4.5  | Fastest, near-frontier intelligence. Retires no sooner than Oct 2026. |
| `claude-fable-5`    | Claude Fable 5    | Legacy — superseded by Fable 5.1.                                     |
| `claude-opus-4-8`   | Claude Opus 4.8   | Legacy.                                                               |
| `claude-opus-4-7`   | Claude Opus 4.7   | Legacy.                                                               |
| `claude-opus-4-6`   | Claude Opus 4.6   | Legacy.                                                               |
| `claude-opus-4-5`   | Claude Opus 4.5   | Legacy.                                                               |
| `claude-sonnet-4-6` | Claude Sonnet 4.6 | Legacy.                                                               |
| `claude-sonnet-4-5` | Claude Sonnet 4.5 | Legacy.                                                               |

All Claude models support tool use. Env var fallback: `WEBINY_API_ANTHROPIC_API_KEY`.

### OpenAI (`OpenAiSdkFactory.ts`)

| Model ID        | Name          | Notes                                                                 |
| --------------- | ------------- | --------------------------------------------------------------------- |
| `gpt-6-astra`   | GPT-6 Astra   | Most capable. State-of-the-art across coding, cybersecurity, science. |
| `gpt-5.6-sol`   | GPT-5.6 Sol   | Flagship of the 5.6 family.                                           |
| `gpt-5.6-terra` | GPT-5.6 Terra | Balanced for everyday work.                                           |
| `gpt-5.6-luna`  | GPT-5.6 Luna  | Cost-efficient.                                                       |
| `gpt-5.5`       | GPT-5.5       |                                                                       |
| `gpt-5.5-pro`   | GPT-5.5 Pro   |                                                                       |
| `gpt-5.4`       | GPT-5.4       |                                                                       |
| `gpt-5.4-pro`   | GPT-5.4 Pro   |                                                                       |
| `gpt-5.4-mini`  | GPT-5.4 Mini  |                                                                       |
| `gpt-5.4-nano`  | GPT-5.4 Nano  |                                                                       |
| `gpt-5.2`       | GPT-5.2       |                                                                       |
| `gpt-5.2-pro`   | GPT-5.2 Pro   |                                                                       |
| `gpt-5`         | GPT-5         |                                                                       |
| `gpt-5-pro`     | GPT-5 Pro     |                                                                       |
| `gpt-5-mini`    | GPT-5 Mini    |                                                                       |
| `gpt-5-nano`    | GPT-5 Nano    |                                                                       |
| `o3-pro`        | o3 Pro        | Reasoning model.                                                      |
| `gpt-4.1`       | GPT-4.1       |                                                                       |
| `gpt-4.1-mini`  | GPT-4.1 Mini  |                                                                       |
| `gpt-4.1-nano`  | GPT-4.1 Nano  | Deprecated by OpenAI but still available via API.                     |
| `gpt-4o`        | GPT-4o        | Deprecated by OpenAI but still available via API.                     |
| `gpt-4o-mini`   | GPT-4o Mini   | Deprecated by OpenAI but still available via API.                     |
| `o4-mini`       | o4 Mini       | Deprecated by OpenAI but still available via API.                     |
| `o3`            | o3            | Retired from ChatGPT (Aug 2026) but still available via API.          |

All listed models support function calling. Env var fallback: `WEBINY_API_OPENAI_API_KEY`.

### Google (`GoogleSdkFactory.ts`)

| Model ID                | Name                  | Notes                                                          |
| ----------------------- | --------------------- | -------------------------------------------------------------- |
| `gemini-3.8-flash`      | Gemini 3.8 Flash      | Latest. Long-horizon coding and autonomous agents.             |
| `gemini-3.7-flash`      | Gemini 3.7 Flash      | Software engineering focus.                                    |
| `gemini-3.6-flash`      | Gemini 3.6 Flash      | Multi-step workflows, improved code generation.                |
| `gemini-3.5-flash`      | Gemini 3.5 Flash      | Near-Pro intelligence at Flash pricing.                        |
| `gemini-3.5-flash-lite` | Gemini 3.5 Flash Lite | Lightweight agentic workflows.                                 |
| `gemini-3.1-flash-lite` | Gemini 3.1 Flash Lite | High-frequency lightweight tasks. No streaming tool call args. |
| `gemini-2.5-pro`        | Gemini 2.5 Pro        | High-capability reasoning and coding. 1M token context.        |
| `gemini-2.5-flash`      | Gemini 2.5 Flash      |                                                                |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite |                                                                |

All listed models support function calling. Env var fallback: `WEBINY_API_GOOGLE_API_KEY`.

## Adding a new model

Add an entry to the `*_MODELS` array in the corresponding factory file. The model ID must match what the provider's SDK expects. Verify that the model supports tool/function calling before adding it.

## Adding a new provider

1. Create a new `<Provider>SdkFactory.ts` implementing `AiSdkFactory`.
2. Add the `@ai-sdk/<provider>` dependency to `packages/api-core/package.json`.
3. Register the factory in `feature.ts`.
4. Update this file.

## Updating models

Check the provider docs periodically and update the lists. Keep deprecated-but-functional models at the bottom — users may have presets referencing them, and removing a model breaks `ProvidersHandler` validation on save.

Sources used for the last update (September 2026):

- Anthropic: https://platform.claude.com/docs/en/docs/about-claude/models/overview
- OpenAI: https://developers.openai.com/api/docs/models/all
- Google: https://ai.google.dev/gemini-api/docs/models
