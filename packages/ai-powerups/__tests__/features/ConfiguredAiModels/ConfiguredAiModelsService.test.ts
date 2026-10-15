import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ConfiguredAiModelsFeature } from "~/api/features/ConfiguredAiModels/feature.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import { createAiModel, registerFakeAi, registerFakeLogger } from "~tests/__helpers/FakeAi.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";

const ANTHROPIC_MODELS = [
    createAiModel("anthropic", "claude-sonnet-4-5"),
    createAiModel("anthropic", "claude-haiku-4-5")
];
const OPENAI_MODELS = [createAiModel("openai", "gpt-5")];

interface ServiceParams {
    connections: AiConnectionPreset[];
    models?: AiModel[] | Error;
    settings?: Error;
}

const setupService = (params: ServiceParams) => {
    const container = new Container();
    ConfiguredAiModelsFeature.register(container);
    registerFakeAi(container, params.models ?? [...ANTHROPIC_MODELS, ...OPENAI_MODELS]);
    registerFakeAiPowerUpsSettings(
        container,
        params.settings ?? createAiPowerUpsSettings({ connections: params.connections })
    );
    const logger = registerFakeLogger(container);
    return { service: container.resolve(ConfiguredAiModelsService), logger };
};

const createService = (params: ServiceParams) => {
    return setupService(params).service;
};

describe("ConfiguredAiModelsService.list (R169)", () => {
    it("lists the models of the providers that have a connection with a key, without the connection factories", async () => {
        // `listModelsByConnections` throws in the fake (R169), so an Ok result proves it is not read.
        const service = createService({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "anthropic" })]
        });

        const result = await service.list();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual([
            {
                id: "anthropic/claude-sonnet-4-5",
                name: "claude-sonnet-4-5 name",
                providerId: "anthropic",
                providerName: "anthropic provider"
            },
            {
                id: "anthropic/claude-haiku-4-5",
                name: "claude-haiku-4-5 name",
                providerId: "anthropic",
                providerName: "anthropic provider"
            }
        ]);
    });

    it("lists the models of every provider that has a usable connection", async () => {
        const service = createService({
            connections: [
                createConnectionPreset({ id: "conn-1", sdkName: "anthropic" }),
                createConnectionPreset({ id: "conn-2", sdkName: "openai" })
            ]
        });

        const result = await service.list();

        expect(result.value?.map(model => model.id)).toEqual([
            "anthropic/claude-sonnet-4-5",
            "anthropic/claude-haiku-4-5",
            "openai/gpt-5"
        ]);
    });

    it("leaves out a provider whose only connection has no key", async () => {
        const service = createService({
            connections: [
                createConnectionPreset({ id: "conn-1", sdkName: "anthropic" }),
                createConnectionPreset({ id: "conn-2", sdkName: "openai", apiKeyEncrypted: "" })
            ]
        });

        const result = await service.list();

        expect(result.value?.map(model => model.providerId)).toEqual(["anthropic", "anthropic"]);
    });

    it("keeps a provider when one of its connections has a key and another has none", async () => {
        const service = createService({
            connections: [
                createConnectionPreset({ id: "conn-1", sdkName: "openai", apiKeyEncrypted: "" }),
                createConnectionPreset({ id: "conn-2", sdkName: "openai" })
            ]
        });

        const result = await service.list();

        expect(result.value?.map(model => model.id)).toEqual(["openai/gpt-5"]);
    });

    it("lists a model once when two connections serve the same provider", async () => {
        const service = createService({
            connections: [
                createConnectionPreset({ id: "conn-1", sdkName: "anthropic" }),
                createConnectionPreset({ id: "conn-2", sdkName: "anthropic" })
            ]
        });

        const result = await service.list();

        expect(result.value?.map(model => model.id)).toEqual([
            "anthropic/claude-sonnet-4-5",
            "anthropic/claude-haiku-4-5"
        ]);
    });

    it("deduplicates a model the provider list returns twice, first one wins", async () => {
        const service = createService({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "openai" })],
            models: [
                createAiModel("openai", "gpt-5"),
                { ...createAiModel("openai", "gpt-5"), modelName: "Renamed" }
            ]
        });

        const result = await service.list();

        expect(result.value).toHaveLength(1);
        expect(result.value?.[0].name).toBe("gpt-5 name");
    });

    it("is empty without any connection", async () => {
        const service = createService({ connections: [] });

        const result = await service.list();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual([]);
    });

    it("fails, logs once and does not leak the message when the settings cannot be read", async () => {
        const { service, logger } = setupService({
            connections: [],
            settings: new Error("settings are gone")
        });

        const result = await service.list();

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Failed to load AI Power-Ups settings.");
        expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it("fails, logs the raw error once and does not reject when listing the provider models throws", async () => {
        const raw = new Error("provider list exploded");
        const { service, logger } = setupService({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "anthropic" })],
            models: raw
        });

        const result = await service.list();

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Failed to list the configured AI models.");
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error.mock.calls[0][0]).toEqual({ error: raw });
    });

    it("does not log a successful list", async () => {
        const { service, logger } = setupService({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "anthropic" })]
        });

        await service.list();

        expect(logger.error).not.toHaveBeenCalled();
    });
});

describe("ConfiguredAiModelsService.findConnection (R169)", () => {
    it("returns the connection of the model's provider", async () => {
        const anthropic = createConnectionPreset({ id: "conn-1", sdkName: "anthropic" });
        const openai = createConnectionPreset({ id: "conn-2", sdkName: "openai" });
        const service = createService({ connections: [anthropic, openai] });

        const result = await service.findConnection("openai/gpt-5");

        expect(result.value).toEqual(openai);
    });

    it("returns the first connection that has a key", async () => {
        const keyless = createConnectionPreset({
            id: "conn-1",
            sdkName: "anthropic",
            apiKeyEncrypted: ""
        });
        const first = createConnectionPreset({ id: "conn-2", sdkName: "anthropic" });
        const second = createConnectionPreset({ id: "conn-3", sdkName: "anthropic" });
        const service = createService({ connections: [keyless, first, second] });

        const result = await service.findConnection("anthropic/claude-sonnet-4-5");

        expect(result.value?.id).toBe("conn-2");
    });

    it("answers a model the provider list does not know", async () => {
        const anthropic = createConnectionPreset({ id: "conn-1", sdkName: "anthropic" });
        const service = createService({ connections: [anthropic] });

        const result = await service.findConnection("anthropic/a-model-nobody-lists");

        expect(result.value).toEqual(anthropic);
    });

    it("answers null for a provider without a usable connection", async () => {
        const service = createService({
            connections: [
                createConnectionPreset({ id: "conn-1", sdkName: "anthropic" }),
                createConnectionPreset({ id: "conn-2", sdkName: "openai", apiKeyEncrypted: "" })
            ]
        });

        const keyless = await service.findConnection("openai/gpt-5");
        const missing = await service.findConnection("mistral/large");

        expect(keyless.isOk()).toBe(true);
        expect(keyless.value).toBeNull();
        expect(missing.value).toBeNull();
    });

    it("matches the provider exactly, not by prefix", async () => {
        const service = createService({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "openai-compatible" })]
        });

        const result = await service.findConnection("openai/gpt-5");

        expect(result.value).toBeNull();
    });

    it.each(["", "claude", "anthropic/", "/claude-sonnet-4-5"])(
        "answers null for the unparsable model %j",
        async model => {
            const service = createService({
                connections: [createConnectionPreset({ id: "conn-1", sdkName: "anthropic" })]
            });

            const result = await service.findConnection(model);

            expect(result.isOk()).toBe(true);
            expect(result.value).toBeNull();
        }
    );

    it("answers a model id that itself contains a slash on its provider's connection", async () => {
        const gateway = createConnectionPreset({ id: "conn-1", sdkName: "openrouter" });
        const service = createService({ connections: [gateway] });

        const result = await service.findConnection("openrouter/meta/llama-3");

        expect(result.value).toEqual(gateway);
    });

    it.each(["a//", "a//b", "a/b//c", "a/b/"])(
        "answers null for the model %j with an empty segment, although provider a has a connection",
        async model => {
            const service = createService({
                connections: [createConnectionPreset({ id: "conn-1", sdkName: "a" })]
            });

            const result = await service.findConnection(model);

            expect(result.isOk()).toBe(true);
            expect(result.value).toBeNull();
        }
    );

    it("fails, logs once and does not leak the message when the settings cannot be read", async () => {
        const { service, logger } = setupService({
            connections: [],
            settings: new Error("settings are gone")
        });

        const result = await service.findConnection("anthropic/claude-sonnet-4-5");

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Failed to load AI Power-Ups settings.");
        expect(logger.error).toHaveBeenCalledTimes(1);
    });
});
