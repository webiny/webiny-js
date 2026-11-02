import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import {
    AiCapability,
    ResolveAiCapabilityUseCase
} from "~/api/features/Capabilities/abstractions.js";
import { ResolveAiCapabilityUseCaseImplementation } from "~/api/features/Capabilities/ResolveAiCapabilityUseCase.js";
import { AiCapabilityDisabledError } from "~/api/features/Capabilities/AiCapabilityDisabledError.js";
import { AiModelNotAvailableError } from "~/api/features/Capabilities/AiModelNotAvailableError.js";
import { ConfiguredAiModelsFeature } from "~/api/features/ConfiguredAiModels/feature.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import { createAiModel, registerFakeAi } from "~tests/__helpers/FakeAi.js";
import { registerRecordingLogger } from "~tests/__helpers/RecordingLogger.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";
import type { AiPowerUpsSettingsOptions } from "~tests/__helpers/FakeAiPowerUpsSettings.js";

const CAPABILITY_ID = "test.capability";
const ROLE_MODEL = "anthropic/claude-sonnet-4-5";
const STEP_MODEL = "openai/gpt-5";

class TestCapability implements AiCapability.Interface {
    readonly id = CAPABILITY_ID;
    readonly label = "Test capability";
    readonly description = "For tests.";
    readonly defaultRole = "standard" as const;
    readonly guidance = "Webiny guidance.";
}

class StubEncryption implements Encryption.Interface {
    public async encrypt(plain: string) {
        return `encrypted-${plain}`;
    }

    /** Prefixed so a test can tell a decrypted key from the stored ciphertext. */
    public async decrypt(encrypted: string) {
        return `decrypted:${encrypted}`;
    }
}

const ANTHROPIC = createConnectionPreset({ id: "conn-1", sdkName: "anthropic" });
const OPENAI = createConnectionPreset({ id: "conn-2", sdkName: "openai" });

/** The provider catalog `Ai.listModels()` answers by default: both step and role models. */
const CATALOG: AiModel[] = [
    createAiModel("anthropic", "claude-sonnet-4-5"),
    createAiModel("openai", "gpt-5")
];

interface ResolverParams extends AiPowerUpsSettingsOptions {
    connections: AiConnectionPreset[];
    settings?: Error;
    /** What `Ai.listModels()` answers (or throws); defaults to `CATALOG`. */
    models?: AiModel[] | Error;
}

const setupResolver = (params: ResolverParams) => {
    const container = new Container();
    container.register(
        AiCapability.createImplementation({ implementation: TestCapability, dependencies: [] })
    );
    container.register(
        Encryption.createImplementation({ implementation: StubEncryption, dependencies: [] })
    );
    ConfiguredAiModelsFeature.register(container);
    container.register(ResolveAiCapabilityUseCaseImplementation);
    registerFakeAi(container, params.models ?? CATALOG);
    const logger = registerRecordingLogger(container);
    registerFakeAiPowerUpsSettings(container, params.settings ?? createAiPowerUpsSettings(params));
    return { resolver: container.resolve(ResolveAiCapabilityUseCase), logger };
};

const createResolver = (params: ResolverParams) => {
    return setupResolver(params).resolver;
};

describe("ResolveAiCapabilityUseCase with a model (R169)", () => {
    it("resolves the model as given on the connection of its provider", async () => {
        const resolver = createResolver({ connections: [ANTHROPIC, OPENAI] });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            capabilityId: CAPABILITY_ID,
            model: STEP_MODEL,
            connection: { sdkName: "openai", apiKey: "decrypted:encrypted-conn-2" },
            roleId: null,
            fellBackToStandard: false,
            guidance: "Webiny guidance.",
            additionalInstructions: ""
        });
    });

    it("ignores the role and the capability's pinned model", async () => {
        const resolver = createResolver({
            connections: [ANTHROPIC, OPENAI],
            capabilityItems: {
                [CAPABILITY_ID]: {
                    overrides: { roleId: "fast", connectionId: "conn-1", model: ROLE_MODEL }
                }
            }
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.value?.model).toBe(STEP_MODEL);
        expect(result.value?.connection.sdkName).toBe("openai");
        expect(result.value?.roleId).toBeNull();
    });

    it("works with no model role configured at all", async () => {
        const resolver = createResolver({
            connections: [OPENAI],
            roles: {
                fast: { connectionId: "", model: "" },
                standard: { connectionId: "", model: "" },
                vision: { connectionId: "", model: "" }
            }
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.isOk()).toBe(true);
    });

    it("keeps the capability's guidance and the project's additional instructions", async () => {
        const resolver = createResolver({
            connections: [OPENAI],
            capabilityItems: {
                [CAPABILITY_ID]: { overrides: { additionalInstructions: "  Be brief.  " } }
            }
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.value?.guidance).toBe("Webiny guidance.");
        expect(result.value?.additionalInstructions).toBe("Be brief.");
    });

    it("uses the first connection with a key and skips one without", async () => {
        const keyless = createConnectionPreset({
            id: "conn-3",
            sdkName: "openai",
            apiKeyEncrypted: ""
        });
        const resolver = createResolver({ connections: [keyless, OPENAI] });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.value?.connection.apiKey).toBe("decrypted:encrypted-conn-2");
    });

    it("fails with the model-not-available error when the provider has a connection but no longer lists the model", async () => {
        const { resolver, logger } = setupResolver({ connections: [OPENAI] });

        const result = await resolver.execute(CAPABILITY_ID, "openai/a-model-nobody-lists");

        expect(result.error).toBeInstanceOf(AiModelNotAvailableError);
        expect((result.error as AiModelNotAvailableError).model).toBe(
            "openai/a-model-nobody-lists"
        );
        expect(logger.errors).toHaveLength(0);
    });

    it("fails with the service's fixed text, logged once by the service, when the provider model list cannot be read", async () => {
        const { resolver, logger } = setupResolver({
            connections: [OPENAI],
            models: new Error("provider is down: key sk-123")
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.error).not.toBeInstanceOf(AiModelNotAvailableError);
        expect(result.error.message).toBe("Failed to list the configured AI models.");
        expect(logger.errors).toHaveLength(1);
        expect(logger.errors[0].message).toBe("Could not list the AI provider models.");
    });

    it("fails with the model-not-available error when the provider has no connection", async () => {
        const resolver = createResolver({ connections: [ANTHROPIC] });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.error).toBeInstanceOf(AiModelNotAvailableError);
        expect((result.error as AiModelNotAvailableError).code).toBe("AI_MODEL_NOT_AVAILABLE");
        expect((result.error as AiModelNotAvailableError).model).toBe(STEP_MODEL);
        expect(result.error.message).toBe(
            'The model "openai/gpt-5" is not available. Add a connection for its provider under Settings → AI Power-Ups.'
        );
    });

    it("fails with the model-not-available error when the only connection has no key", async () => {
        const resolver = createResolver({
            connections: [
                createConnectionPreset({ id: "conn-2", sdkName: "openai", apiKeyEncrypted: "" })
            ]
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.error).toBeInstanceOf(AiModelNotAvailableError);
    });

    it.each(["", "gpt-5", "openai/", "a//", "openai//gpt-5"])(
        "fails with the model-not-available error for the unparsable model %j",
        async model => {
            const resolver = createResolver({
                connections: [OPENAI, createConnectionPreset({ id: "conn-9", sdkName: "a" })]
            });

            const result = await resolver.execute(CAPABILITY_ID, model);

            expect(result.error).toBeInstanceOf(AiModelNotAvailableError);
        }
    );

    it("keeps the enabled gate: a switched off capability fails first, with a model", async () => {
        const resolver = createResolver({
            connections: [ANTHROPIC],
            capabilityItems: { [CAPABILITY_ID]: { enabled: false, overrides: {} } }
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.error).toBeInstanceOf(AiCapabilityDisabledError);
    });

    it("keeps the enabled gate: a switched off capability fails with an available model too", async () => {
        const resolver = createResolver({
            connections: [OPENAI],
            capabilityItems: { [CAPABILITY_ID]: { enabled: false, overrides: {} } }
        });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.error).toBeInstanceOf(AiCapabilityDisabledError);
    });

    it("fails for an unknown capability id, with a model", async () => {
        const resolver = createResolver({ connections: [OPENAI] });

        const result = await resolver.execute("test.unknown", STEP_MODEL);

        expect(result.error.message).toMatch(/^Unknown AI capability "test\.unknown"/);
    });

    it("fails when the settings cannot be read, with a model", async () => {
        const resolver = createResolver({ connections: [], settings: new Error("gone") });

        const result = await resolver.execute(CAPABILITY_ID, STEP_MODEL);

        expect(result.isFail()).toBe(true);
        expect(result.error.message).toBe("Failed to load AI Power-Ups settings.");
    });

    it("resolves exactly as before without a model (role, override and fallback)", async () => {
        const resolver = createResolver({ connections: [ANTHROPIC, OPENAI] });

        const withoutArgument = await resolver.execute(CAPABILITY_ID);
        const withUndefined = await resolver.execute(CAPABILITY_ID, undefined);

        expect(withoutArgument.value).toEqual({
            capabilityId: CAPABILITY_ID,
            model: ROLE_MODEL,
            connection: { sdkName: "anthropic", apiKey: "decrypted:encrypted-conn-1" },
            roleId: "standard",
            fellBackToStandard: false,
            guidance: "Webiny guidance.",
            additionalInstructions: ""
        });
        expect(withUndefined.value).toEqual(withoutArgument.value);
    });

    it("still fails without a model when no role is configured, with the unchanged text", async () => {
        const resolver = createResolver({
            connections: [OPENAI],
            roles: {
                fast: { connectionId: "", model: "" },
                standard: { connectionId: "", model: "" },
                vision: { connectionId: "", model: "" }
            }
        });

        const result = await resolver.execute(CAPABILITY_ID);

        expect(result.error.message).toBe(
            'No model is configured for the "standard" role. Pick one under Settings → AI Power-Ups → Model roles.'
        );
    });
});
