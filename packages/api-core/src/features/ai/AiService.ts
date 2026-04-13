import { createImplementation } from "@webiny/feature/api";
import { generateText } from "ai";
import { streamText } from "ai";
import { AiService as AiServiceAbstraction } from "./abstractions.js";
import { AiGateway } from "./abstractions.js";
import type { AiServiceGenerateTextParams } from "./abstractions.js";
import type { AiServiceStreamTextParams } from "./abstractions.js";

class AiServiceImpl implements AiServiceAbstraction.Interface {
    constructor(private readonly aiGateway: AiGateway.Interface) {}

    generateText(params: AiServiceGenerateTextParams): ReturnType<typeof generateText> {
        const { model, ...rest } = params;
        return this.aiGateway.languageModel(model).then(resolvedModel => {
            // Cast required: spreading the discriminated Prompt union loses its narrowing.
            return generateText({ model: resolvedModel, ...rest } as Parameters<
                typeof generateText
            >[0]);
        });
    }

    async streamText(params: AiServiceStreamTextParams): Promise<ReturnType<typeof streamText>> {
        const { model, ...rest } = params;
        const resolvedModel = await this.aiGateway.languageModel(model);
        // Cast required: spreading the discriminated Prompt union loses its narrowing.
        return streamText({ model: resolvedModel, ...rest } as Parameters<typeof streamText>[0]);
    }
}

export const AiService = createImplementation({
    abstraction: AiServiceAbstraction,
    implementation: AiServiceImpl,
    dependencies: [AiGateway]
});
