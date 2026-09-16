import { AiChatProvider as Abstraction } from "@webiny/ai-chat/api/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "~/api/features/Capabilities/index.js";
import { AI_CHAT_CAPABILITY } from "./capability.js";

/**
 * Runs the assistant on whatever the "Admin assistant" capability resolves to.
 *
 * It used to read `providers.presets[0]` and decrypt that key itself, which is the duplication
 * `ResolveAiCapabilityUseCase` replaced: the same precedence rules now decide the model for every AI
 * feature, and the assistant gets a row in Settings → AI Power-Ups like the rest of them.
 *
 * The one thing it adds over the other capability consumers is the prompt. `AiChatUseCase` cannot
 * reach a capability (`@webiny/ai-chat` does not depend on this package, and should not — the
 * assistant works without AI Power-Ups installed), so the composed system text travels back through
 * the resolution it already asks for.
 */
class PowerUpsAiChatProviderImpl implements Abstraction.Interface {
    constructor(private readonly resolveCapability: ResolveAiCapabilityUseCase.Interface) {}

    async resolve(): Promise<Abstraction.Resolution> {
        const result = await this.resolveCapability.execute(AI_CHAT_CAPABILITY);

        /*
         * Thrown rather than swallowed. Every message the resolver produces names the setting to
         * fix, and the chat route turns a throw into an `error` event the palette shows, so the
         * editor reads "pick a model under Settings → AI Power-Ups → Model roles" instead of
         * watching the assistant fail silently.
         */
        if (result.isFail()) {
            throw result.error;
        }

        const capability = result.value;

        return {
            model: capability.model,
            apiKey: capability.connection.apiKey,
            systemPrompt: withAdditionalInstructions(capability)
        };
    }
}

export const PowerUpsAiChatProvider = Abstraction.createImplementation({
    implementation: PowerUpsAiChatProviderImpl,
    dependencies: [ResolveAiCapabilityUseCase]
});
