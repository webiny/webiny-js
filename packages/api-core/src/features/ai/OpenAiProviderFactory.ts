import { createImplementation } from "@webiny/feature/api";
import { AiProviderFactory as AiProviderFactoryAbstraction } from "./abstractions.js";
import type { IAiProvider } from "./abstractions.js";

class OpenAiProviderFactoryImpl implements AiProviderFactoryAbstraction.Interface {
    readonly name = "openai";

    async execute(): Promise<IAiProvider> {
        const { createOpenAI } = await import("@ai-sdk/openai");
        // createOpenAI() reads OPENAI_API_KEY from env at request time.
        return createOpenAI() as unknown as IAiProvider;
    }
}

export const OpenAiProviderFactory = createImplementation({
    abstraction: AiProviderFactoryAbstraction,
    implementation: OpenAiProviderFactoryImpl,
    dependencies: []
});
