import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AiModelRegistry } from "@webiny/api-core/features/ai/index.js";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { BaseGraphQLSchema } from "~/api/graphql/BaseGraphQLSchema.js";
import AiPowerUpsSettingsGraphQLMapperImpl from "~/api/graphql/AiPowerUpsSettingsGraphQLMapper.js";
import ConnectionsGraphQLMapper from "~/api/features/Connections/ConnectionsGraphQLMapper.js";
import ProvidersGraphQLMapper from "~/api/features/Providers/ProvidersGraphQLMapper.js";
import { GetSettingsRepository } from "~/api/features/GetSettings/abstractions.js";
import { GetSettingsUseCaseImplementation } from "~/api/features/GetSettings/GetSettingsUseCase.js";
import { GetDecryptedSettingsUseCase } from "~/api/features/GetDecryptedSettings/index.js";
import { GetDecryptedSettingsFeature } from "~/api/features/GetDecryptedSettings/feature.js";
import { UpdateSettingsRepository } from "~/api/features/UpdateSettings/abstractions.js";
import { UpdateSettingsUseCaseImplementation } from "~/api/features/UpdateSettings/UpdateSettingsUseCase.js";
import { ListModelsFeature } from "~/api/features/ListModels/feature.js";
import { AiCapability } from "~/api/features/Capabilities/abstractions.js";
import { ListAiCapabilitiesUseCaseImplementation } from "~/api/features/Capabilities/ListAiCapabilitiesUseCase.js";
import { QueueWbGeneratePageContentFeature } from "~/api/features/QueueWbGeneratePageContent/feature.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";
import { composeSchema } from "~tests/__helpers/composeSchema.js";
import { createAiModel } from "~tests/__helpers/FakeAi.js";
import {
    FakeTaskService,
    resetFakeTasks,
    triggeredTasks
} from "~tests/__helpers/FakeTaskService.js";
import { registerFakeSecurity } from "~tests/__helpers/FakeSecurity.js";
import type { FakeSecurityOptions } from "~tests/__helpers/FakeSecurity.js";
import { registerFakeListFiles } from "~tests/__helpers/FakeListFiles.js";

const ENCRYPTED = "ciphertext-of-sk-ant-secret";
const MASKED = "sk-ant-s…cret";

const createStoredSettings = (): IAiPowerUpsSettings => {
    return {
        connections: {
            presets: [
                {
                    id: "conn-1",
                    name: "Anthropic",
                    sdkName: "anthropic",
                    apiKeyEncrypted: ENCRYPTED,
                    apiKeyMasked: MASKED
                }
            ]
        },
        providers: {
            presets: [
                {
                    id: "legacy-1",
                    name: "Legacy",
                    model: "anthropic/claude-sonnet-4-5",
                    apiKeyEncrypted: ENCRYPTED,
                    apiKeyMasked: MASKED
                }
            ]
        }
    } as unknown as IAiPowerUpsSettings;
};

class TestCapability implements AiCapability.Interface {
    readonly id = "testCapability";
    readonly label = "Test capability";
    readonly description = "For tests.";
    readonly defaultRole = "standard" as const;
}

interface Setup {
    container: Container;
    updates: IAiPowerUpsSettings[];
    permissionChecks: string[];
    wbEditChecks: string[];
}

const setup = (options: FakeSecurityOptions = {}): Setup => {
    const container = new Container();
    const updates: IAiPowerUpsSettings[] = [];
    const { permissionChecks, wbEditChecks } = registerFakeSecurity(container, options);
    registerFakeListFiles(container);

    container.registerInstance(GetSettingsRepository, {
        get: async () => Result.ok(createStoredSettings())
    });
    container.registerInstance(UpdateSettingsRepository, {
        execute: async (input: IAiPowerUpsSettings) => {
            updates.push(input);
            return Result.ok(input);
        }
    });
    container.registerInstance(EventPublisher, {
        publish: async () => {}
    } as unknown as EventPublisher.Interface);
    container.registerInstance(Encryption, {
        encrypt: async (plain: string) => `encrypted:${plain}`,
        decrypt: async (encrypted: string) => `decrypted:${encrypted}`
    });
    container.registerInstance(AiModelRegistry, {
        listModels: async () => [createAiModel("anthropic", "claude-sonnet-4-5")]
    });
    container.register(
        AiCapability.createImplementation({ implementation: TestCapability, dependencies: [] })
    );
    container.register(FakeTaskService);

    container.register(GetSettingsUseCaseImplementation);
    GetDecryptedSettingsFeature.register(container);
    container.register(UpdateSettingsUseCaseImplementation);
    ListModelsFeature.register(container);
    container.register(ListAiCapabilitiesUseCaseImplementation);
    QueueWbGeneratePageContentFeature.register(container);

    container.register(ConnectionsGraphQLMapper);
    container.register(ProvidersGraphQLMapper);
    container.register(AiPowerUpsSettingsGraphQLMapperImpl);
    container.register(BaseGraphQLSchema);

    return { container, updates, permissionChecks, wbEditChecks };
};

const call = async (
    container: Container,
    type: "AiPowerUpsQuery" | "AiPowerUpsMutation",
    field: string,
    args: Record<string, unknown> = {}
): Promise<unknown> => {
    const { resolvers } = await composeSchema(container);
    return resolvers[type][field]({}, args, { container }, {});
};

beforeEach(() => {
    resetFakeTasks();
});

describe("AI Power-Ups settings security", () => {
    describe("getSettings", () => {
        it("is refused for anonymous callers", async () => {
            const { container } = setup({ anonymous: true });

            await expect(call(container, "AiPowerUpsQuery", "getSettings")).rejects.toBeInstanceOf(
                NotAuthorizedError
            );
        });

        it("never returns a key to a logged-in caller without the settings permission", async () => {
            const { container } = setup();

            const settings = (await call(container, "AiPowerUpsQuery", "getSettings")) as any;

            expect(settings.connections.presets[0]).toMatchObject({
                id: "conn-1",
                apiKey: null
            });
            expect(settings.providers.presets[0].apiKey).toBeNull();
            expect(JSON.stringify(settings)).not.toContain(ENCRYPTED);
            expect(JSON.stringify(settings)).not.toContain(MASKED);
        });

        it("returns only the masked key to a caller with the settings permission", async () => {
            const { container } = setup({ canManageSettings: true });

            const settings = (await call(container, "AiPowerUpsQuery", "getSettings")) as any;

            expect(settings.connections.presets[0].apiKey).toBe(MASKED);
            expect(settings.providers.presets[0].apiKey).toBe(MASKED);
            expect(JSON.stringify(settings)).not.toContain(ENCRYPTED);
        });
    });

    describe("updateSettings", () => {
        it("is refused without the settings permission and stores nothing", async () => {
            const { container, updates, permissionChecks } = setup();

            const response = (await call(container, "AiPowerUpsMutation", "updateSettings", {
                input: { connections: { presets: [] } }
            })) as any;

            expect(response.data).toBeNull();
            expect(response.error.code).toBe("NOT_AUTHORIZED");
            expect(updates).toHaveLength(0);
            expect(permissionChecks).toContain("settings");
        });

        it("is refused for anonymous callers", async () => {
            const { container, updates } = setup({ anonymous: true });

            const response = (await call(container, "AiPowerUpsMutation", "updateSettings", {
                input: { connections: { presets: [] } }
            })) as any;

            expect(response.data).toBeNull();
            expect(response.error).toBeTruthy();
            expect(updates).toHaveLength(0);
        });

        it("stores the settings with the settings permission", async () => {
            const { container, updates } = setup({ canManageSettings: true });

            const response = (await call(container, "AiPowerUpsMutation", "updateSettings", {
                input: {
                    connections: {
                        presets: [
                            {
                                id: "conn-1",
                                name: "Anthropic",
                                sdkName: "anthropic",
                                apiKey: MASKED
                            }
                        ]
                    }
                }
            })) as any;

            expect(response.error).toBeNull();
            expect(updates).toHaveLength(1);
        });
    });

    describe("listModels and listCapabilities", () => {
        it("are refused for anonymous callers", async () => {
            const { container } = setup({ anonymous: true });

            await expect(call(container, "AiPowerUpsQuery", "listModels")).rejects.toBeInstanceOf(
                NotAuthorizedError
            );
            await expect(
                call(container, "AiPowerUpsQuery", "listCapabilities")
            ).rejects.toBeInstanceOf(NotAuthorizedError);
        });

        it("answer a logged-in caller without the settings permission", async () => {
            const { container } = setup();

            const models = (await call(container, "AiPowerUpsQuery", "listModels")) as any[];
            const capabilities = (await call(
                container,
                "AiPowerUpsQuery",
                "listCapabilities"
            )) as any[];

            expect(models.map(model => model.modelId)).toEqual(["claude-sonnet-4-5"]);
            expect(capabilities.map(capability => capability.id)).toEqual(["testCapability"]);
        });
    });

    describe("generatePageContent", () => {
        const args = {
            prompt: "A landing page",
            components: [],
            tools: []
        };

        it("is refused for anonymous callers and queues nothing", async () => {
            const { container } = setup({ anonymous: true });

            await expect(
                call(container, "AiPowerUpsMutation", "generatePageContent", args)
            ).rejects.toBeInstanceOf(NotAuthorizedError);
            expect(triggeredTasks).toHaveLength(0);
        });

        it("is refused without the page edit permission and queues nothing", async () => {
            const { container, wbEditChecks } = setup({ canEditPages: false });

            await expect(
                call(container, "AiPowerUpsMutation", "generatePageContent", args)
            ).rejects.toBeInstanceOf(NotAuthorizedError);
            expect(wbEditChecks).toEqual(["page"]);
            expect(triggeredTasks).toHaveLength(0);
        });

        it("queues the task for a caller who can edit pages", async () => {
            const { container, wbEditChecks } = setup();

            const result = (await call(
                container,
                "AiPowerUpsMutation",
                "generatePageContent",
                args
            )) as any;

            expect(result).toEqual({ id: "task-1" });
            expect(wbEditChecks).toEqual(["page"]);
            expect(triggeredTasks).toHaveLength(1);
            expect(triggeredTasks[0].identityId).toBe("user-1");
        });
    });

    describe("GetDecryptedSettingsUseCase", () => {
        it("is refused for anonymous callers", async () => {
            const { container } = setup({ anonymous: true });

            const result = await container.resolve(GetDecryptedSettingsUseCase).execute();

            expect(result.isFail()).toBe(true);
            expect(result.error).toBeInstanceOf(NotAuthorizedError);
        });

        it("decrypts the connection keys for internal callers", async () => {
            const { container } = setup();

            const result = await container.resolve(GetDecryptedSettingsUseCase).execute();

            expect(result.isOk()).toBe(true);
            expect(result.value.connections.presets[0].apiKey).toBe(`decrypted:${ENCRYPTED}`);
        });
    });
});
