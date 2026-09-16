import { AiChatProvider as Abstraction } from "./abstractions.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

/**
 * Model from the environment, key left to the provider's own SDK factory.
 *
 * The fallback for projects without AI Power-Ups, and what keeps a bare checkout working with one
 * environment variable. Returns no `apiKey` on purpose: each SDK factory already falls back to its
 * own variable (e.g. `WEBINY_API_ANTHROPIC_API_KEY`), so the key never has to pass through here.
 */
class EnvAiChatProviderImpl implements Abstraction.Interface {
    async resolve(): Promise<Abstraction.Resolution> {
        return {
            model: process.env["WEBINY_API_AI_CHAT_MODEL"] || DEFAULT_MODEL,
            // No settings record to append from, so the prompt is exactly what the code ships.
            systemPrompt: SYSTEM_PROMPT
        };
    }
}

export const EnvAiChatProvider = Abstraction.createImplementation({
    implementation: EnvAiChatProviderImpl,
    dependencies: []
});
