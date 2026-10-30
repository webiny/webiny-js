import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { Extension } from "~/api/Extension.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { registerFakeAi } from "~tests/__helpers/FakeAi.js";
import { registerRecordingLogger } from "~tests/__helpers/RecordingLogger.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";

const createContainer = (enabledFlags: string[]): Container => {
    const container = new Container();
    container.registerInstance(FeatureFlags, {
        get: () => ({ isEnabled: (name: string) => enabledFlags.includes(name) })
    } as unknown as FeatureFlags.Interface);
    Extension.register(container);
    // `Extension.register` needs only `FeatureFlags`. The resolver needs `Encryption` and the
    // service needs `Logger`, `Ai` and the settings, so the bare container supplies them.
    container.registerInstance(Encryption, {
        encrypt: async (plain: string) => plain,
        decrypt: async (encrypted: string) => encrypted
    } as unknown as Encryption.Interface);
    registerRecordingLogger(container);
    registerFakeAi(container, []);
    registerFakeAiPowerUpsSettings(
        container,
        createAiPowerUpsSettings({
            connections: [createConnectionPreset({ id: "conn-1", sdkName: "anthropic" })]
        })
    );
    return container;
};

describe("ConfiguredAiModelsFeature registration (R177)", () => {
    it("is registered with aiPowerups on and advancedPublishingWorkflow off", async () => {
        const container = createContainer(["aiPowerups"]);

        const service = container.resolve(ConfiguredAiModelsService);
        const result = await service.findConnection("anthropic/claude-sonnet-4-5");

        expect(result.value?.id).toBe("conn-1");
    });

    it("sits next to the capability resolver, which depends on it", () => {
        const container = createContainer(["aiPowerups"]);

        expect(() => container.resolveAll(ConfiguredAiModelsService)).not.toThrow();
        expect(container.resolveAll(ConfiguredAiModelsService)).toHaveLength(1);
        expect(() => container.resolve(ResolveAiCapabilityUseCase)).not.toThrow();
    });

    it("is not registered with aiPowerups off", () => {
        const container = createContainer([]);

        expect(container.resolveAll(ConfiguredAiModelsService)).toHaveLength(0);
    });
});
