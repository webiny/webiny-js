import { Container } from "@webiny/di";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { AiModelRegistry } from "~/features/ai/AiModelRegistry.js";
import { AiModelRegistry as AiModelRegistryAbstraction } from "~/features/ai/abstractions.js";
import { RemoteAiModelCatalog } from "~/features/ai/RemoteAiModelCatalog.js";
import { AiSdkFactory } from "~/features/ai/abstractions.js";
import type { IAiSdk } from "~/features/ai/abstractions.js";
import { Logger } from "~/features/logger/index.js";
import { HttpClient } from "~/features/httpClient/HttpClient.js";

class TestSdkFactory implements AiSdkFactory.Interface {
    constructor(
        readonly id: string,
        readonly name: string,
        readonly models: AiSdkFactory.Interface["models"]
    ) {}

    execute(): Promise<IAiSdk> {
        throw new Error("Not implemented.");
    }
}

const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
};

const catalog = {
    providers: [
        {
            id: "anthropic",
            name: "Anthropic (remote)",
            models: [
                {
                    id: "claude-remote",
                    name: "Claude Remote",
                    api: "chat",
                    supports: { tools: true, temperature: true, streaming: true }
                }
            ]
        },
        {
            id: "openai",
            name: "OpenAI",
            models: [
                {
                    id: "o3",
                    name: "o3",
                    deprecated: "2026-06-11",
                    endOfLife: "2026-12-11"
                }
            ]
        },
        {
            id: "deepseek",
            name: "DeepSeek",
            models: [{ id: "deepseek-chat", name: "DeepSeek Chat" }]
        }
    ]
};

const createRegistry = () => {
    const container = new Container();
    const anthropic = new TestSdkFactory("anthropic", "Anthropic", [
        { id: "claude-local", name: "Claude Local" }
    ]);
    const openAi = new TestSdkFactory("openai", "OpenAI", [{ id: "gpt-local", name: "GPT Local" }]);
    const custom = new TestSdkFactory("custom", "Custom", [
        { id: "custom-model", name: "Custom Model" }
    ]);

    container.registerInstance(Logger, logger);
    container.registerInstance(AiSdkFactory, anthropic);
    container.registerInstance(AiSdkFactory, openAi);
    container.registerInstance(AiSdkFactory, custom);
    container.register(HttpClient);
    container.register(RemoteAiModelCatalog);
    container.register(AiModelRegistry);
    return container.resolve(AiModelRegistryAbstraction);
};

const mockFetch = (response: () => Promise<Response>) => {
    const fetchMock = vi.fn(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
};

let now = Date.now();

describe("AiModelRegistry", () => {
    beforeEach(() => {
        // Moves past the catalog's process-wide cache, so every test fetches.
        now += 24 * 60 * 60 * 1000;
        vi.useFakeTimers({ toFake: ["Date"], now });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("lists catalog models for providers that have an SDK factory", async () => {
        mockFetch(async () => Response.json(catalog));

        const models = await createRegistry().listModels();

        expect(models).toEqual([
            {
                providerId: "anthropic",
                providerName: "Anthropic (remote)",
                modelId: "claude-remote",
                modelName: "Claude Remote",
                deprecated: undefined,
                endOfLife: undefined,
                // Known capabilities are kept, unknown ones (`streaming`) dropped.
                supports: { tools: true, temperature: true }
            },
            {
                providerId: "openai",
                providerName: "OpenAI",
                modelId: "o3",
                modelName: "o3",
                deprecated: new Date("2026-06-11"),
                endOfLife: new Date("2026-12-11")
            },
            {
                providerId: "custom",
                providerName: "Custom",
                modelId: "custom-model",
                modelName: "Custom Model",
                deprecated: undefined,
                endOfLife: undefined
            }
        ]);
    });

    it("fetches the catalog once while it is cached", async () => {
        const fetchMock = mockFetch(async () => Response.json(catalog));

        const registry = createRegistry();
        await registry.listModels();
        await registry.listModels();
        await createRegistry().listModels();

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("falls back to the SDK factory models when the catalog can't be loaded", async () => {
        mockFetch(async () => {
            throw new Error("Network down.");
        });

        const models = await createRegistry().listModels();

        const ids = models.map(m => `${m.providerId}/${m.modelId}`);
        expect(ids).toEqual(["anthropic/claude-local", "openai/gpt-local", "custom/custom-model"]);
        expect(logger.warn).toHaveBeenCalled();
    });

    it("falls back to the SDK factory models when the catalog is invalid", async () => {
        mockFetch(async () => Response.json({ providers: "nope" }));

        const models = await createRegistry().listModels();

        const ids = models.map(m => m.modelId);
        expect(ids).toEqual(["claude-local", "gpt-local", "custom-model"]);
    });
});
