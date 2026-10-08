import { Container } from "@webiny/di";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { Ai } from "~/features/ai/Ai.js";
import { Ai as AiAbstraction } from "~/features/ai/abstractions.js";
import { AiConnectionFactory } from "~/features/ai/abstractions.js";
import { AiModelRegistry } from "~/features/ai/abstractions.js";
import { AiSdkFactory } from "~/features/ai/abstractions.js";
import type { AiModel } from "~/features/ai/abstractions.js";
import type { IAiModelSupports } from "~/features/ai/abstractions.js";
import type { IAiSdk } from "~/features/ai/abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";

const createModel = (modelId: string, supports?: IAiModelSupports): AiModel => ({
    providerId: "test",
    providerName: "Test",
    modelId,
    modelName: modelId,
    deprecated: undefined,
    endOfLife: undefined,
    supports
});

const models: AiModel[] = [
    createModel("with-temperature", { tools: true, temperature: true }),
    createModel("without-temperature", { tools: true, temperature: false }),
    createModel("unknown-temperature", { tools: true }),
    createModel("no-supports")
];

let languageModel: MockLanguageModelV4;

class TestSdkFactory implements AiSdkFactory.Interface {
    readonly id = "test";
    readonly name = "Test";
    readonly models = [];

    async execute(): Promise<IAiSdk> {
        return { languageModel: () => languageModel };
    }
}

const createAi = () => {
    const container = new Container();
    container.registerInstance(AiSdkFactory, new TestSdkFactory());
    container.registerInstance(AiConnectionFactory, {
        execute: async () => ({ id: "test", sdkName: "test" })
    });
    container.registerInstance(EventPublisher, { publish: vi.fn() } as any);
    container.registerInstance(AiModelRegistry, { listModels: async () => models });
    container.register(Ai);
    return container.resolve(AiAbstraction);
};

const sentTemperature = () => languageModel.doGenerateCalls[0].temperature;

describe("Ai temperature", () => {
    beforeEach(() => {
        languageModel = new MockLanguageModelV4({
            doGenerate: {
                content: [{ type: "text", text: "ok" }],
                finishReason: { unified: "stop", raw: undefined },
                usage: {
                    inputTokens: {
                        total: 1,
                        noCache: undefined,
                        cacheRead: undefined,
                        cacheWrite: undefined
                    },
                    outputTokens: { total: 1, text: undefined, reasoning: undefined }
                },
                warnings: []
            }
        });
    });

    it("sends temperature to a model that supports it", async () => {
        await createAi().generateText({
            model: "test/with-temperature",
            prompt: "Hi",
            temperature: 0.3
        });

        expect(sentTemperature()).toBe(0.3);
    });

    it("leaves temperature out for a model that doesn't support it", async () => {
        await createAi().generateText({
            model: "test/without-temperature",
            prompt: "Hi",
            temperature: 0.3
        });

        expect(sentTemperature()).toBeUndefined();
    });

    it("leaves temperature out when the model says nothing about it", async () => {
        const ai = createAi();

        await ai.generateText({
            model: "test/unknown-temperature",
            prompt: "Hi",
            temperature: 0.3
        });
        await ai.generateText({ model: "test/no-supports", prompt: "Hi", temperature: 0.3 });

        expect(languageModel.doGenerateCalls.map(call => call.temperature)).toEqual([
            undefined,
            undefined
        ]);
    });

    it("keeps the rest of the call intact", async () => {
        await createAi().generateText({
            model: "test/without-temperature",
            prompt: "Hi",
            temperature: 0.3,
            maxOutputTokens: 123
        });

        expect(languageModel.doGenerateCalls[0].maxOutputTokens).toBe(123);
    });
});
