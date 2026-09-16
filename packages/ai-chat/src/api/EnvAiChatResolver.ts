import { AiChatResolver as Abstraction } from "./abstractions.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

const DEFAULT_MODEL = "anthropic/claude-sonnet-5";

/**
 * Model from the environment, key left to the vendor's own SDK factory.
 *
 * The fallback for projects without AI Power-Ups, and what keeps a bare checkout working with one
 * environment variable. Returns no `apiKey` on purpose: each SDK factory already falls back to its
 * own variable (e.g. `WEBINY_API_ANTHROPIC_API_KEY`), so the key never has to pass through here.
 *
 * This is why the assistant cannot simply be a capability consumer.
 * `ResolveAiCapabilityUseCase` documents that it has "deliberately no environment-variable
 * fallback", and `AiChatFeature` is registered by the core API stack in every project, including
 * ones whose AI Power-Ups settings were never filled in.
 */
class EnvAiChatResolverImpl implements Abstraction.Interface {
    async resolve(): Promise<Abstraction.Resolution> {
        const model = process.env["WEBINY_API_AI_CHAT_MODEL"] || DEFAULT_MODEL;

        return {
            model,
            // No credential record to read a vendor from, so the model string is the only source.
            connection: { sdkName: model.split("/")[0] ?? "" },
            // Nothing to append from either, so the prompt is exactly what the code ships.
            systemPrompt: SYSTEM_PROMPT
        };
    }
}

export const EnvAiChatResolver = Abstraction.createImplementation({
    implementation: EnvAiChatResolverImpl,
    dependencies: []
});
