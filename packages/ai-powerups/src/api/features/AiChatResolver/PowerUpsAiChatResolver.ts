import { AiChatResolver as Abstraction } from "@webiny/ai-chat/api/index.js";
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
 * The one thing it adds over the other capability consumers is the prompt, because `AiChatUseCase`
 * cannot reach a capability itself. `@webiny/ai-chat` does not depend on this package and should
 * not: the core API stack registers `AiChatFeature` in every project, while AI Power-Ups is an
 * extension on top of it, so the dependency would point from the base at something layered above it.
 * The composed system text therefore travels back through the resolution the chat already asks for.
 */
class PowerUpsAiChatResolverImpl implements Abstraction.Interface {
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
            // Passed through whole: the resolver already checked this vendor against the model's.
            connection: capability.connection,
            systemPrompt: withAdditionalInstructions(capability)
        };
    }
}

export const PowerUpsAiChatResolver = Abstraction.createImplementation({
    implementation: PowerUpsAiChatResolverImpl,
    dependencies: [ResolveAiCapabilityUseCase]
});
