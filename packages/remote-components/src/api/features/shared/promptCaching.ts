import type { Ai } from "@webiny/api-core/features/ai/index.js";

/**
 * The most a generation or refinement may write. A component with its CSS and example defaults runs to
 * about 10K tokens; this is three times that. It bounds what one call can cost — a model writing out an
 * enormous defaults list otherwise writes until something else stops it.
 */
export const MAX_OUTPUT_TOKENS = 32_000;

/**
 * The static system prompt, sent so providers can cache it.
 *
 * Generation and refinement send the same ~27 KB system prompt on every call (`buildComponentPrompt`;
 * refinement adds a fixed suffix), and the component extraction pipeline makes dozens of these calls
 * per site. Everything that varies — the component's contract, the retry feedback, the reference image
 * — is in the user message, after the system prompt, so the system prompt is an identical prefix on
 * every call and is exactly what a prompt cache reuses.
 *
 * - Anthropic caches only what is marked: the system message carries an explicit `cacheControl`
 *   breakpoint, so the system prompt is cached and nothing after it is. Writing the cache costs more
 *   than a plain read of those tokens, once per five minutes; every call inside that window reads it
 *   at a fraction of the price.
 * - OpenAI caches a long enough prompt prefix automatically, with no marker. `promptCacheKey` routes
 *   calls that share a prefix to the same cache, which raises the hit rate when many arrive at once.
 *
 * Provider options are keyed by provider, so the Anthropic option is ignored by OpenAI and the other
 * way round. Both report what was read from and written to the cache in the call's usage.
 */
export const cachedSystemPrompt = (
    systemText: string,
    cacheKey: string
): Pick<Ai.GenerateTextParams, "system" | "providerOptions"> => ({
    system: {
        role: "system",
        content: systemText,
        providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }
    },
    providerOptions: { openai: { promptCacheKey: cacheKey } }
});
