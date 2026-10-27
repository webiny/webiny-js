### Task 15: `ConfiguredAiModelsService` and the resolver `model` argument

Spec 7.3; D56, D101; R165, R169, R170, R177, R178; A60; Review Focus 6 (one model source, the gate holds). The workflow author chooses the model on the step (user answer Q2), and "models with a configured connection" must have exactly one source, used by the resolver, `listAiModels` (Task 16) and `AiStepType.checkConfig` (Task 17):

- New DI service `ConfiguredAiModelsService` (`packages/ai-powerups/src/api/features/ConfiguredAiModels/`, dependencies `Ai`, `GetSettingsUseCase` and `Logger`):
  - `list(): Promise<Result<ConfiguredAiModel[], Error>>`: `Ai.listModels()` filtered to the models whose `providerId` equals the `sdkName` of a settings connection preset (`settings.connections.presets`) with a truthy `apiKeyEncrypted` (the resolver's own source of a usable connection). Rows `{ id, name, providerId, providerName }` with `id = "<providerId>/<modelId>"` (the full id `Ai` expects) and `name = modelName`, deduplicated by `id` (first wins), in `Ai.listModels()` order. `Ai.listModelsByConnections()` is NOT used: it reads `AiConnectionFactory` registrations that nothing registers (R169). A key that no longer works is not detected (A60). Failed settings read, throwing settings read or throwing `Ai.listModels()` is a failed Result carrying a fixed-text `Error` (never a rejected promise): `Failed to load AI Power-Ups settings.` for a settings failure, `Failed to list the configured AI models.` for a throwing `Ai.listModels()`. The service logs the raw failure once (`Logger.error` with the raw error); callers (Tasks 16, 17, 19) show their own fixed text and do NOT log it again (the same split as `StepRunStaleCheckService`). The raw error never reaches a step reason or the model. `findConnection` does the same for a failed or throwing settings read.
  - `findConnection(model: string): Promise<Result<AiConnectionPreset | null, Error>>`: the first settings connection preset with a truthy `apiKeyEncrypted` whose `sdkName` equals the provider half of `model` (`sdkNameFromModel`); `null` when none, or when `model` is not of the form `<provider>/<id>`: a non-empty provider before the first `/` and a non-empty id after it. The id may itself contain `/` (a gateway model such as `openrouter/meta/llama`: `sdkNameFromModel` only reads the part before the first `/`), but no empty segment (`"a//"`, `"a/b//c"`, a trailing `/`). It does not look at `Ai.listModels()`: a model the provider list does not know is still resolved through its provider's connection, exactly as the capability overrides are.
- `ResolveAiCapabilityUseCase.execute(capabilityId, model?)` gains the optional `model`. Without it nothing changes (the existing tests pass unchanged apart from one `ConfiguredAiModelsService` stub (import, class, registration) in each of two files, see Step 3). With it, after the unknown-capability check and the **enabled gate** (`AiCapabilityDisabledError`, so the licence and enabled gate hold with and without `model`):
  - the model is used as given: no role, no override `connectionId`/`model`, no standard fallback;
  - the connection comes from `ConfiguredAiModelsService.findConnection(model)`; `null` (no connection with a key for the provider, or an unparsable model) fails with `AiModelNotAvailableError` (`Capabilities/AiModelNotAvailableError.ts`, `code = "AI_MODEL_NOT_AVAILABLE"`, field `model`, message `The model "<model>" is not available. Add a connection for its provider under Settings → AI Power-Ups.`, the fixed text, no settings content); a failed `findConnection` is returned as is;
  - the result: `{ capabilityId, model, connection: { sdkName: <preset sdkName>, apiKey: <decrypted> }, roleId: null, fellBackToStandard: false, guidance: <the capability's>, additionalInstructions: <the capability's override, trimmed, or ""> }`.
- `ConfiguredAiModelsFeature` registers the service and is registered in `Extension.ts` under the plain `aiPowerups` gate, right after `CapabilitiesFeature.register(container)`: the resolver needs it with `aiPowerups` on even when workflows are off (R177). It is not inside Task 16's combined workflows gate.
- Additive and live from this commit (R178): nothing calls the new argument yet; no step type is registered.

**Files:**
- Create: `packages/ai-powerups/src/api/features/ConfiguredAiModels/abstractions.ts`
- Create: `packages/ai-powerups/src/api/features/ConfiguredAiModels/ConfiguredAiModelsService.ts`
- Create: `packages/ai-powerups/src/api/features/ConfiguredAiModels/feature.ts`
- Create: `packages/ai-powerups/src/api/features/ConfiguredAiModels/index.ts`
- Create: `packages/ai-powerups/src/api/features/Capabilities/AiModelNotAvailableError.ts`
- Modify: `packages/ai-powerups/src/api/features/Capabilities/abstractions.ts`
- Modify: `packages/ai-powerups/src/api/features/Capabilities/ResolveAiCapabilityUseCase.ts`
- Modify: `packages/ai-powerups/src/api/features/Capabilities/index.ts`
- Modify: `packages/ai-powerups/src/api/Extension.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeAiPowerUpsSettings.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeAi.ts`
- Create: `packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsService.test.ts`
- Create: `packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts`
- Create: `packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts`
- Modify (one `ConfiguredAiModelsService` stub: import, class, registration in its `resolver` helper, no assertion changes): `packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityUseCase.test.ts`
- Modify (the same stub: import, class, registration in its `resolver` helper, no assertion changes): `packages/ai-powerups/__tests__/features/upgradeFromLegacyProviders.test.ts`

**Interfaces:**
- Consumes:
  - Existing: `Ai` (`@webiny/api-core/features/ai/index.js`; `Ai.Interface.listModels(): Promise<AiModel[]>`, `AiModel { providerId; providerName; modelId; modelName }`, `listModelsByConnections()`), `GetSettingsUseCase` (`~/api/features/GetSettings/index.js`; `execute(): Promise<Result<IAiPowerUpsSettings>>`), `AiConnectionPreset` (`~/api/features/Connections/index.js`, the real type: `{ id; name; sdkName; apiKey?; apiKeyMasked; apiKeyEncrypted }`), `sdkNameFromModel(model)` (`~/api/features/shared/modelId.js`), `Encryption` (`@webiny/api-core/features/encryption/index.js`; the resolver needs it, not `Extension.register`), `Logger` (`@webiny/api-core/features/logger/index.js`; `error(objOrMsg, ...args)`), `AiCapability`, `AiCapabilityDisabledError`, `isCapabilityEnabled`.
- Produces (matches the contract):
  - `ConfiguredAiModelsService` (dependencies `Ai`, `GetSettingsUseCase`, `Logger`; logs a failed read once, callers do not log it again) with `interface ConfiguredAiModel { id: string; name: string; providerId: string; providerName: string }`, `list()`, `findConnection(model)` (`~/api/features/ConfiguredAiModels/index.js`; consumed by Tasks 16, 17, 19), `ConfiguredAiModelsFeature`.
  - `IResolveAiCapabilityUseCase.execute(capabilityId: string, model?: string): Promise<Result<IResolvedAiCapability, Error>>`; `AiModelNotAvailableError` (exported from the `Capabilities` barrel; Tasks 17 and 19 map it to `The model "<model>" is not available.`, R170).
  - Test helpers `registerFakeAiPowerUpsSettings`, `createConnectionPreset`, `createAiPowerUpsSettings` (`__tests__/__helpers/FakeAiPowerUpsSettings.ts`) and `registerFakeAi`, `createAiModel`, `registerFakeLogger` (`__tests__/__helpers/FakeAi.ts`), reused by Tasks 16, 17 and 19.

- [ ] **Step 1: Write the failing tests**

Create `packages/ai-powerups/__tests__/__helpers/FakeAiPowerUpsSettings.ts`:

```ts
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface ConnectionPresetOptions {
    id: string;
    sdkName: string;
    /** The stored ciphertext; `""` is a connection without a key. Defaults to `encrypted-<id>`. */
    apiKeyEncrypted?: string;
    name?: string;
}

export const createConnectionPreset = (options: ConnectionPresetOptions): AiConnectionPreset => {
    return {
        id: options.id,
        name: options.name ?? `Connection ${options.id}`,
        sdkName: options.sdkName,
        apiKeyMasked: "sk-…9999",
        apiKeyEncrypted: options.apiKeyEncrypted ?? `encrypted-${options.id}`
    };
};

export interface AiPowerUpsSettingsOptions {
    connections?: AiConnectionPreset[];
    /** Capability entries by capability id, e.g. `{ "test.capability": { enabled: false } }`. */
    capabilityItems?: Record<string, unknown>;
    /** Model roles by role id; defaults to a `standard` role on `conn-1`. */
    roles?: Record<string, { connectionId: string; model: string }>;
}

/** The settings an `AI Power-Ups` project stores, reduced to what the resolver and service read. */
export const createAiPowerUpsSettings = (
    options: AiPowerUpsSettingsOptions = {}
): IAiPowerUpsSettings => {
    return {
        connections: { presets: options.connections ?? [] },
        modelRoles: {
            roles: options.roles ?? {
                fast: { connectionId: "", model: "" },
                standard: { connectionId: "conn-1", model: "anthropic/claude-sonnet-4-5" },
                vision: { connectionId: "", model: "" }
            }
        },
        capabilities: { items: options.capabilityItems ?? {} }
    } as unknown as IAiPowerUpsSettings;
};

/**
 * Registers a `GetSettingsUseCase` answering `settings`, or failing when given an `Error`. Call it
 * after the features under test so it wins over their own registration.
 */
export const registerFakeAiPowerUpsSettings = (
    container: Container,
    settings: IAiPowerUpsSettings | Error
): void => {
    class FakeGetSettings implements GetSettingsUseCase.Interface {
        public async execute() {
            return settings instanceof Error ? Result.fail(settings) : Result.ok(settings);
        }
    }
    container.register(
        GetSettingsUseCase.createImplementation({
            implementation: FakeGetSettings,
            dependencies: []
        })
    );
};
```

Create `packages/ai-powerups/__tests__/__helpers/FakeAi.ts`:

```ts
import type { Container } from "@webiny/di";
import { vi } from "vitest";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";

export const createAiModel = (providerId: string, modelId: string): AiModel => {
    return {
        providerId,
        providerName: `${providerId} provider`,
        modelId,
        modelName: `${modelId} name`
    };
};

/**
 * Registers a fake `Ai` whose `listModels` answers `models` (or throws when given an `Error`).
 * No model is ever called: `generateText` and `streamText` throw, and so does
 * `listModelsByConnections` (it reads `AiConnectionFactory` registrations nothing registers, R169),
 * which makes a use of it a visible failure instead of an empty list.
 */
export const registerFakeAi = (container: Container, models: AiModel[] | Error): void => {
    class FakeAi implements Ai.Interface {
        public async generateText(): Promise<never> {
            throw new Error("The fake Ai does not generate text.");
        }

        public async streamText(): Promise<never> {
            throw new Error("The fake Ai does not stream text.");
        }

        public async listModels(): Promise<AiModel[]> {
            if (models instanceof Error) {
                throw models;
            }
            return models;
        }

        public async listModelsByConnections(): Promise<AiModel[]> {
            throw new Error("listModelsByConnections must not be used (R169).");
        }

        public async listModelsByConnection(): Promise<AiModel[]> {
            throw new Error("listModelsByConnection must not be used (R169).");
        }
    }
    container.register(Ai.createImplementation({ implementation: FakeAi, dependencies: [] }));
};

/** Registers a `Logger` whose `error` is a spy, so a test can count and read what was logged. */
export const registerFakeLogger = (container: Container) => {
    const error = vi.fn();
    container.registerInstance(Logger, {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error,
        fatal: vi.fn(),
        log: vi.fn()
    } as unknown as Logger.Interface);
    return { error };
};
```

Create `packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsService.test.ts`:

```ts
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
```

Create `packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { Extension } from "~/api/Extension.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { registerFakeAi, registerFakeLogger } from "~tests/__helpers/FakeAi.js";
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
    registerFakeLogger(container);
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
```

Create `packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { AiCapability, ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/abstractions.js";
import { ResolveAiCapabilityUseCaseImplementation } from "~/api/features/Capabilities/ResolveAiCapabilityUseCase.js";
import { AiCapabilityDisabledError } from "~/api/features/Capabilities/AiCapabilityDisabledError.js";
import { AiModelNotAvailableError } from "~/api/features/Capabilities/AiModelNotAvailableError.js";
import { ConfiguredAiModelsFeature } from "~/api/features/ConfiguredAiModels/feature.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import { registerFakeAi, registerFakeLogger } from "~tests/__helpers/FakeAi.js";
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

interface ResolverParams extends AiPowerUpsSettingsOptions {
    connections: AiConnectionPreset[];
    settings?: Error;
}

const createResolver = (params: ResolverParams) => {
    const container = new Container();
    container.register(
        AiCapability.createImplementation({ implementation: TestCapability, dependencies: [] })
    );
    container.register(
        Encryption.createImplementation({ implementation: StubEncryption, dependencies: [] })
    );
    ConfiguredAiModelsFeature.register(container);
    container.register(ResolveAiCapabilityUseCaseImplementation);
    registerFakeAi(container, []);
    registerFakeLogger(container);
    registerFakeAiPowerUpsSettings(container, params.settings ?? createAiPowerUpsSettings(params));
    return container.resolve(ResolveAiCapabilityUseCase);
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

    it("resolves a model the provider list does not know (the model is used as given)", async () => {
        const resolver = createResolver({ connections: [OPENAI] });

        const result = await resolver.execute(CAPABILITY_ID, "openai/a-model-nobody-lists");

        expect(result.value?.model).toBe("openai/a-model-nobody-lists");
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
            connections: [createConnectionPreset({ id: "conn-2", sdkName: "openai", apiKeyEncrypted: "" })]
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsService.test.ts packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts 2>&1 | tail -50`
Expected: FAIL: the imports of `~/api/features/ConfiguredAiModels/...` and `Capabilities/AiModelNotAvailableError.js` do not resolve (the three files fail to load). Record the RED output.

(`packages/ai-powerups` has no `ci.config.json` before Task 20, so there is no `yarn test:os` run for it yet.)

- [ ] **Step 3: Implement**

Create `packages/ai-powerups/src/api/features/ConfiguredAiModels/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";

export interface ConfiguredAiModel {
    /** The full id `Ai` expects: `"<providerId>/<modelId>"`. */
    id: string;
    /** The provider's human-friendly model name. */
    name: string;
    providerId: string;
    providerName: string;
}

export interface IConfiguredAiModelsService {
    /**
     * `Ai.listModels()` filtered to the providers that have a settings connection with a stored
     * key, deduplicated by `id`. A stored key is not proven to work (A60).
     */
    list(): Promise<Result<ConfiguredAiModel[], Error>>;
    /**
     * The connection the resolver runs `model` on: the first settings connection with a stored key
     * whose `sdkName` is the provider half of `model`. `null` when there is none or `model` is
     * not `<provider>/<id>`.
     */
    findConnection(model: string): Promise<Result<AiConnectionPreset | null, Error>>;
}

/**
 * The one source of "models with a configured connection" (R169): the capability resolver, the
 * workflow editor's model list and the AI step's save-time check all read it.
 */
export const ConfiguredAiModelsService = createAbstraction<IConfiguredAiModelsService>(
    "AiPowerUpsConfiguredAiModelsService"
);

export namespace ConfiguredAiModelsService {
    export type Interface = IConfiguredAiModelsService;
    export type Model = ConfiguredAiModel;
}
```

Create `packages/ai-powerups/src/api/features/ConfiguredAiModels/ConfiguredAiModelsService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { sdkNameFromModel } from "~/api/features/shared/modelId.js";
import type { AiConnectionPreset } from "~/api/features/Connections/index.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { ConfiguredAiModelsService as Abstraction } from "./abstractions.js";

class ConfiguredAiModelsServiceImpl implements Abstraction.Interface {
    public constructor(
        private ai: Ai.Interface,
        private getSettings: GetSettingsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async list(): Promise<Result<Abstraction.Model[], Error>> {
        // Failures are logged here, once, with the raw error; the callers show their own fixed
        // text and do not log again. The returned Error carries a fixed message only.
        let settings: IAiPowerUpsSettings;
        try {
            const settingsResult = await this.getSettings.execute();
            if (settingsResult.isFail()) {
                this.logger.error(
                    { error: settingsResult.error },
                    "Could not read the AI Power-Ups settings to list the configured models."
                );
                return Result.fail(new Error("Failed to load AI Power-Ups settings."));
            }
            settings = settingsResult.value;
        } catch (error) {
            this.logger.error(
                { error },
                "Could not read the AI Power-Ups settings to list the configured models."
            );
            return Result.fail(new Error("Failed to load AI Power-Ups settings."));
        }

        let models: AiModel[];
        try {
            models = await this.ai.listModels();
        } catch (error) {
            this.logger.error({ error }, "Could not list the AI provider models.");
            return Result.fail(new Error("Failed to list the configured AI models."));
        }

        const presets = settings.connections?.presets ?? [];
        const providerIds = new Set(
            presets.filter(preset => preset.apiKeyEncrypted).map(preset => preset.sdkName)
        );

        const configured = new Map<string, Abstraction.Model>();
        for (const model of models) {
            if (!providerIds.has(model.providerId)) {
                continue;
            }
            const id = `${model.providerId}/${model.modelId}`;
            if (configured.has(id)) {
                continue;
            }
            configured.set(id, {
                id,
                name: model.modelName,
                providerId: model.providerId,
                providerName: model.providerName
            });
        }
        return Result.ok([...configured.values()]);
    }

    public async findConnection(model: string): Promise<Result<AiConnectionPreset | null, Error>> {
        // `<provider>/<id>`: a non-empty provider before the first "/" and a non-empty id after it.
        // The id may contain further "/" (a gateway model), but no empty segment ("a//", "a/b/").
        const separator = model.indexOf("/");
        const idSegments = model.slice(separator + 1).split("/");
        if (separator < 1 || idSegments.some(segment => segment === "")) {
            return Result.ok(null);
        }

        let settings: IAiPowerUpsSettings;
        try {
            const settingsResult = await this.getSettings.execute();
            if (settingsResult.isFail()) {
                this.logger.error(
                    { error: settingsResult.error },
                    "Could not read the AI Power-Ups settings to find a model connection."
                );
                return Result.fail(new Error("Failed to load AI Power-Ups settings."));
            }
            settings = settingsResult.value;
        } catch (error) {
            this.logger.error(
                { error },
                "Could not read the AI Power-Ups settings to find a model connection."
            );
            return Result.fail(new Error("Failed to load AI Power-Ups settings."));
        }

        const sdkName = sdkNameFromModel(model);
        const presets = settings.connections?.presets ?? [];
        const connection = presets.find(preset => {
            return preset.sdkName === sdkName && Boolean(preset.apiKeyEncrypted);
        });
        return Result.ok(connection ?? null);
    }
}

export const ConfiguredAiModelsService = Abstraction.createImplementation({
    implementation: ConfiguredAiModelsServiceImpl,
    dependencies: [Ai, GetSettingsUseCase, Logger]
});
```

Create `packages/ai-powerups/src/api/features/ConfiguredAiModels/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ConfiguredAiModelsService } from "./ConfiguredAiModelsService.js";

export const ConfiguredAiModelsFeature = createFeature({
    name: "AiPowerUpsConfiguredAiModels",
    register(container) {
        container.register(ConfiguredAiModelsService);
    }
});
```

Create `packages/ai-powerups/src/api/features/ConfiguredAiModels/index.ts` (only what other features need: the abstraction and the model type; the feature is imported by `Extension.ts` from `feature.js`, like every other feature here):

```ts
export { ConfiguredAiModelsService } from "./abstractions.js";
export type { ConfiguredAiModel } from "./abstractions.js";
```

Create `packages/ai-powerups/src/api/features/Capabilities/AiModelNotAvailableError.ts`:

```ts
/**
 * A model chosen on a workflow step that no settings connection can run (R169): its provider has
 * no connection with a stored key any more, or the id is not `<provider>/<id>`.
 *
 * Typed, like `AiCapabilityDisabledError`, so a caller maps it to its own fixed text without
 * parsing the message. The message names the fix and carries no settings content.
 */
export class AiModelNotAvailableError extends Error {
    readonly code = "AI_MODEL_NOT_AVAILABLE" as const;

    constructor(readonly model: string) {
        super(
            `The model "${model}" is not available. Add a connection for its provider under Settings → AI Power-Ups.`
        );
    }
}
```

In `packages/ai-powerups/src/api/features/Capabilities/abstractions.ts` change the use case contract (the doc comment goes above the interface):

```ts
export interface IResolveAiCapabilityUseCase {
    /**
     * Without `model` the model comes from the capability's override, role or the `standard` role.
     * With `model` (the full id, `"<provider>/<id>"`) it is used as given on the first settings
     * connection with a key for its provider (R169); the capability must still exist and be
     * enabled. Fails with `AiModelNotAvailableError` when no such connection exists.
     */
    execute(capabilityId: string, model?: string): Promise<Result<IResolvedAiCapability, Error>>;
}
```

In `packages/ai-powerups/src/api/features/Capabilities/ResolveAiCapabilityUseCase.ts` add the imports:

```ts
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { AiModelNotAvailableError } from "./AiModelNotAvailableError.js";
```

the constructor gains the fourth dependency:

```ts
    constructor(
        capabilities: AiCapability.Interface[],
        private getSettings: GetSettingsUseCase.Interface,
        private encryption: Encryption.Interface,
        private configuredModels: ConfiguredAiModelsService.Interface
    ) {
        this.capabilityLookup = new Map(capabilities.map(c => [c.id, c]));
    }
```

`execute` becomes this (the whole method; the new `model` branch sits after the `override` line, the rest is the current body):

```ts
    async execute(
        capabilityId: string,
        model?: string
    ): Promise<Result<IResolvedAiCapability, Error>> {
        const capability = this.capabilityLookup.get(capabilityId);

        if (!capability) {
            // Nothing a project can do about this one: the caller passed an unregistered id.
            return Result.fail(
                new Error(
                    `Unknown AI capability "${capabilityId}". Register it with the AiCapability abstraction.`
                )
            );
        }

        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return Result.fail(new Error("Failed to load AI Power-Ups settings."));
        }

        const settings = settingsResult.value;
        const entry = settings.capabilities?.items?.[capabilityId];

        /*
         * Checked here rather than at every call site, so a capability switched off in settings is
         * off for the GraphQL mutation as much as for the button that usually triggers it. The
         * admin hides the affordance too, but that is a courtesy and this is the actual gate.
         */
        if (!isCapabilityEnabled(entry)) {
            return Result.fail(
                new AiCapabilityDisabledError(capabilityId, capability.label, SETTINGS_PATH)
            );
        }

        const override: AiCapabilityOverride = entry?.overrides ?? {};

        /*
         * A model chosen on a workflow step (R169): used as given, on the connection of its
         * provider. No role, no pinned override, no standard fallback. The enabled gate above
         * already ran, so a switched off capability or a lapsed licence still stops a step.
         */
        if (model !== undefined) {
            const found = await this.configuredModels.findConnection(model);
            if (found.isFail()) {
                return Result.fail(found.error);
            }
            if (!found.value) {
                return Result.fail(new AiModelNotAvailableError(model));
            }
            return Result.ok({
                capabilityId,
                model,
                connection: {
                    sdkName: found.value.sdkName,
                    apiKey: await this.encryption.decrypt(found.value.apiKeyEncrypted)
                },
                roleId: null,
                fellBackToStandard: false,
                guidance: capability.guidance ?? "",
                additionalInstructions: override.additionalInstructions?.trim() ?? ""
            });
        }

        const selection = this.selectModel(settings, capability.defaultRole, override);
        if (selection.isFail()) {
            return Result.fail(selection.error);
        }

        const { connectionId, model: selectedModel, roleId, fellBackToStandard } = selection.value;

        const connection = settings.connections?.presets?.find(c => c.id === connectionId);

        if (!connection) {
            return Result.fail(
                new Error(
                    `"${capability.label}" points at a connection that no longer exists. Pick one under ${SETTINGS_PATH} → Model roles.`
                )
            );
        }

        if (!connection.apiKeyEncrypted) {
            return Result.fail(
                new Error(
                    `The connection "${connection.name}" has no API key. Add one under ${SETTINGS_PATH} → Connections.`
                )
            );
        }

        /*
         * A model is stored fully qualified ("anthropic/claude-sonnet-4-5") and a connection stores
         * its vendor separately, so the two can disagree if a connection is re-pointed at another
         * vendor after a role was filled. Catching it here beats a provider-side auth error.
         */
        const modelSdkName = sdkNameFromModel(selectedModel);
        if (modelSdkName && connection.sdkName && modelSdkName !== connection.sdkName) {
            return Result.fail(
                new Error(
                    `The model "${selectedModel}" cannot run on the "${connection.name}" connection, which is a ${connection.sdkName} credential. Fix the pairing under ${SETTINGS_PATH} → Model roles.`
                )
            );
        }

        return Result.ok({
            capabilityId,
            model: selectedModel,
            connection: {
                sdkName: modelSdkName || connection.sdkName,
                apiKey: await this.encryption.decrypt(connection.apiKeyEncrypted)
            },
            roleId,
            fellBackToStandard,
            // Always the capability's own. Projects adjust prompts by appending, never by
            // replacing, because for most capabilities the prompt is the output contract.
            guidance: capability.guidance ?? "",
            additionalInstructions: override.additionalInstructions?.trim() ?? ""
        });
    }
```

(The destructured `model` of the role path is renamed `selectedModel` because the parameter is now called `model`; `selectModel` is unchanged.) and the registration at the bottom of the file:

```ts
export const ResolveAiCapabilityUseCaseImplementation =
    ResolveAiCapabilityUseCase.createImplementation({
        implementation: ResolveAiCapabilityUseCaseImpl,
        dependencies: [
            [AiCapability, { multiple: true }],
            GetSettingsUseCase,
            Encryption,
            ConfiguredAiModelsService
        ]
    });
```

In `packages/ai-powerups/src/api/features/Capabilities/index.ts` add, next to `AiCapabilityDisabledError`:

```ts
export { AiModelNotAvailableError } from "./AiModelNotAvailableError.js";
```

In `packages/ai-powerups/src/api/Extension.ts` add the import next to the `CapabilitiesFeature` import:

```ts
import { ConfiguredAiModelsFeature } from "./features/ConfiguredAiModels/feature.js";
```

and register it right after `CapabilitiesFeature.register(container);` (under the existing plain `aiPowerups` gate; it is not part of any workflows gate):

```ts
        CapabilitiesFeature.register(container);
        // The resolver's `model` argument reads it, so it lives under the plain `aiPowerups` gate
        // (R177): the workflows-only pieces register in their own, second gate (Task 16).
        ConfiguredAiModelsFeature.register(container);
        ReaderPersonasFeature.register(container);
```

In `packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityUseCase.test.ts` (the existing resolver tests resolve the use case from their own container, which now also needs the service), add the import

```ts
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
```

a stub class next to `StubEncryption`

```ts
/** The `model` argument is not used by these tests; the resolver only needs the service to exist. */
class StubConfiguredAiModels implements ConfiguredAiModelsService.Interface {
    async list() {
        return Result.ok([]);
    }
    async findConnection() {
        return Result.ok(null);
    }
}
```

and this registration in `resolver(...)`, right before `container.register(ResolveAiCapabilityUseCaseImplementation);`:

```ts
    container.register(
        ConfiguredAiModelsService.createImplementation({
            implementation: StubConfiguredAiModels,
            dependencies: []
        })
    );
```

No assertion in that file changes.

`packages/ai-powerups/__tests__/features/upgradeFromLegacyProviders.test.ts` registers `ResolveAiCapabilityUseCaseImplementation` in its own `resolver(...)` helper too, so it gets the same change: the same `ConfiguredAiModelsService` import, the same `StubConfiguredAiModels` class (it needs `Result`, which that file already imports from `@webiny/feature/api`) next to its `StubEncryption`, and the same registration right before `container.register(ResolveAiCapabilityUseCaseImplementation);` in `resolver(...)`. No assertion there changes either.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsService.test.ts packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

The resolver, the barrel and `Extension.ts` changed (additively); the other tests resolve the resolver or register the extension:

Run: `yarn test packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityUseCase.test.ts packages/ai-powerups/__tests__/features/Capabilities/ListAiCapabilitiesUseCase.test.ts packages/ai-powerups/__tests__/features/Capabilities/CapabilitiesHandler.test.ts packages/ai-powerups/__tests__/features/Connections/ConnectionsHandler.test.ts packages/ai-powerups/__tests__/features/upgradeFromLegacyProviders.test.ts packages/ai-powerups/__tests__/features/AdminAssistant/AdminAssistantUseCase.test.ts packages/ai-powerups/__tests__/features/AiImageEnrichment/PrepareImageEnrichmentUseCase.test.ts packages/ai-powerups/__tests__/features/WbTranslatePage/WbTranslatePageDecorator.test.ts 2>&1 | tail -50`
Expected: PASS. `ResolveAiCapabilityUseCase.test.ts` and `upgradeFromLegacyProviders.test.ts` pass with only the stub (import, class, registration) added to each (they are the only tests that register `ResolveAiCapabilityUseCaseImplementation`).

Run: `yarn check:test:types -p ai-powerups --report cli 2>&1 | tail -40`
Expected: no errors. (If `Promise<never>` on the fake `generateText` or `streamText` is not accepted, return the rejected promise through a cast `as unknown as ReturnType<typeof generateText>`.)

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/ai-powerups` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(ai-powerups): add ConfiguredAiModelsService and a model argument to the capability resolver

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
