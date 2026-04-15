import { createImplementation } from "@webiny/feature/api";
import { generateText } from "ai";
import { streamText } from "ai";
import { Ai as AiAbstraction } from "./abstractions.js";
import { AiGateway } from "./abstractions.js";
import type { AiGenerateTextParams } from "./abstractions.js";
import type { AiStreamTextParams } from "./abstractions.js";

class AiImpl implements AiAbstraction.Interface {
    constructor(private readonly aiGateway: AiGateway.Interface) {}

    generateText(params: AiGenerateTextParams): ReturnType<typeof generateText> {
        const { model, ...rest } = params;
        return this.aiGateway.languageModel(model).then(resolvedModel => {
            // Cast required: spreading the discriminated Prompt union loses its narrowing.
            return generateText({ model: resolvedModel, ...rest } as Parameters<
                typeof generateText
            >[0]);
        });
    }

    async streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>> {
        const { model, ...rest } = params;
        const resolvedModel = await this.aiGateway.languageModel(model);
        // Cast required: spreading the discriminated Prompt union loses its narrowing.
        return streamText({ model: resolvedModel, ...rest } as Parameters<typeof streamText>[0]);
    }
}

export const Ai = createImplementation({
    abstraction: AiAbstraction,
    implementation: AiImpl,
    dependencies: [AiGateway]
});
