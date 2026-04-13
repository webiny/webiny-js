import { createImplementation } from "@webiny/feature/api";
import { AiProviderFactory as AiProviderFactoryAbstraction } from "./abstractions.js";
import type { IAiProvider } from "./abstractions.js";

class AnthropicProviderFactoryImpl implements AiProviderFactoryAbstraction.Interface {
    readonly name = "anthropic";

    async execute(): Promise<IAiProvider> {
        const { createAnthropic } = await import("@ai-sdk/anthropic");
        // createAnthropic() reads ANTHROPIC_API_KEY from env at request time.
        return createAnthropic() as unknown as IAiProvider;
    }
}

export const AnthropicProviderFactory = createImplementation({
    abstraction: AiProviderFactoryAbstraction,
    implementation: AnthropicProviderFactoryImpl,
    dependencies: []
});
