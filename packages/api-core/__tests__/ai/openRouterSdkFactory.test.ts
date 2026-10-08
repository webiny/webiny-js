import { Container } from "@webiny/di";
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
import { OpenRouterSdkFactory } from "~/features/ai/OpenRouterSdkFactory.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";

const model: AiModel = {
    providerId: "openrouter",
    providerName: "OpenRouter",
    modelId: "anthropic/claude-sonnet-5.5",
    modelName: "Anthropic: Claude Sonnet 5.5",
    deprecated: undefined,
    endOfLife: undefined,
    supports: undefined
};

const createLanguageModel = () =>
    new MockLanguageModelV4({
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

describe("OpenRouterSdkFactory", () => {
    it("builds an OpenRouter chat model for a vendor-prefixed model id", async () => {
        const container = new Container();
        container.register(OpenRouterSdkFactory);
        const factory = container.resolve(AiSdkFactory);

        const sdk = await factory.execute("sk-or-test");
        const languageModel = sdk.languageModel("anthropic/claude-sonnet-5.5");

        expect(factory.id).toBe("openrouter");
        expect(languageModel).toMatchObject({
            provider: "openrouter",
            modelId: "anthropic/claude-sonnet-5.5"
        });
    });

    it("passes everything after the first slash to the SDK", async () => {
        const languageModel = createLanguageModel();
        const requestedModelIds: string[] = [];

        const container = new Container();
        container.registerInstance(AiSdkFactory, {
            id: "openrouter",
            name: "OpenRouter",
            models: [],
            execute: async () => ({
                languageModel: modelId => {
                    requestedModelIds.push(modelId);
                    return languageModel;
                }
            })
        });
        container.registerInstance(AiConnectionFactory, {
            execute: async () => ({ id: "openrouter", sdkName: "openrouter" })
        });
        container.registerInstance(EventPublisher, { publish: vi.fn() } as any);
        container.registerInstance(AiModelRegistry, { listModels: async () => [model] });
        container.register(Ai);

        await container.resolve(AiAbstraction).generateText({
            model: "openrouter/anthropic/claude-sonnet-5.5",
            prompt: "Hi"
        });

        expect(requestedModelIds).toEqual(["anthropic/claude-sonnet-5.5"]);
    });
});
