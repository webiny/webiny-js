import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { createHandler, createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AiModelRegistry } from "@webiny/api-core/features/ai/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { BuildParam } from "@webiny/api-core/features/buildParams/index.js";
import { CmsParametersPlugin, createCmsExtension } from "@webiny/api-headless-cms";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { Extension } from "~/api/Extension.js";
import type { Container } from "@webiny/di";
import { createTenancyAndSecurity } from "./tenancySecurity.js";

export const TEST_SDK_NAME = "test";

class TestAiModelRegistry implements AiModelRegistry.Interface {
    async listModels() {
        return [
            {
                providerId: "test",
                providerName: "Test",
                modelId: "model",
                modelName: "Model",
                deprecated: undefined,
                endOfLife: undefined,
                supports: undefined
            }
        ];
    }
}

/**
 * Records triggered tasks instead of running them.
 */
class TestTaskService {
    public readonly triggered: unknown[] = [];

    async trigger(params: unknown) {
        this.triggered.push(params);
        return { isFail: () => false, value: { id: `task-${this.triggered.length}` } };
    }
}

class EncryptionPassphraseBuildParam implements BuildParam.Interface {
    public readonly key = "EncryptionPassphrase";
    public readonly value = "test-encryption-passphrase";
}

const TestEncryptionPassphrase = BuildParam.createImplementation({
    implementation: EncryptionPassphraseBuildParam,
    dependencies: []
});

export interface UseGraphQLHandlerParams {
    permissions?: SecurityPermission[];
    /**
     * `undefined` uses the default identity, `null` makes the caller anonymous.
     */
    identity?: IdentityData | null;
    /**
     * Registers test-specific implementations (models, decorators) in the request container.
     */
    register?: (container: Container) => void;
}

const createPlugins = (params: UseGraphQLHandlerParams, taskService: TestTaskService) => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    return [
        createApiCore({
            storageOperations: apiCoreStorage.storageOperations,
            testProjectLicense: createTestWcpLicense()
        }),
        ...cmsStorage.plugins,
        graphQLHandlerPlugins(),
        ...createTenancyAndSecurity({
            permissions: params.permissions,
            identity: params.identity
        }),
        new CmsParametersPlugin(async () => {
            return {
                type: "manage"
            };
        }),
        createCmsExtension(),
        createRegisterExtensionPlugin(context => {
            context.container.register(TestEncryptionPassphrase);
            context.container.registerInstance(AiModelRegistry, new TestAiModelRegistry());
            context.container.registerInstance(
                TaskService,
                taskService as unknown as TaskService.Interface
            );
            Extension.register(context.container);
            params.register?.(context.container);
        })
    ];
};

/**
 * Returns the request context, to call internal use cases that GraphQL doesn't expose.
 */
export const useContext = async (params: UseGraphQLHandlerParams = {}) => {
    const handler = createRawHandler<any, any>({
        plugins: [
            ...createPlugins(params, new TestTaskService()),
            createRawEventHandler(async ({ context }) => {
                return context;
            })
        ]
    });
    return handler({ headers: { ["x-tenant"]: "root" } }, {} as LambdaContext);
};

export const useGraphQLHandler = (params: UseGraphQLHandlerParams = {}) => {
    const taskService = new TestTaskService();

    const handler = createHandler({
        plugins: createPlugins(params, taskService),
        debug: false
    });

    const invoke = async (query: string, variables: Record<string, unknown> = {}) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod: "POST",
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json"
                },
                body: JSON.stringify({ query, variables })
            } as unknown as APIGatewayEvent,
            {} as unknown as LambdaContext
        );
        return JSON.parse(response.body || "{}");
    };

    return {
        taskService,
        getSettings() {
            return invoke(/* GraphQL */ `
                query {
                    aiPowerUps {
                        getSettings
                    }
                }
            `);
        },
        updateSettings(input: Record<string, unknown>) {
            return invoke(
                /* GraphQL */ `
                    mutation UpdateSettings($input: JSON!) {
                        aiPowerUps {
                            updateSettings(input: $input) {
                                data
                                error {
                                    code
                                    message
                                }
                            }
                        }
                    }
                `,
                { input }
            );
        },
        listModels() {
            return invoke(/* GraphQL */ `
                query {
                    aiPowerUps {
                        listModels {
                            providerId
                            modelId
                        }
                    }
                }
            `);
        },
        listCapabilities() {
            return invoke(/* GraphQL */ `
                query {
                    aiPowerUps {
                        listCapabilities {
                            id
                        }
                    }
                }
            `);
        },
        generatePageContent() {
            return invoke(/* GraphQL */ `
                mutation {
                    aiPowerUps {
                        generatePageContent(prompt: "Hello", components: [], tools: [])
                    }
                }
            `);
        },
        compareEntryRevisions(modelId: string) {
            return invoke(
                /* GraphQL */ `
                    query CompareEntryRevisions($modelId: String!) {
                        cms {
                            compareEntryRevisions(
                                modelId: $modelId
                                revisionId1: "a#0001"
                                revisionId2: "a#0002"
                            ) {
                                data {
                                    summary
                                }
                                error {
                                    message
                                    code
                                }
                            }
                        }
                    }
                `,
                { modelId }
            );
        },
        generateEntryContent(modelId = "article") {
            return invoke(
                /* GraphQL */ `
                    mutation GenerateEntryContent($modelId: String!) {
                        aiPowerUps {
                            generateEntryContent(prompt: "Hello", modelId: $modelId)
                        }
                    }
                `,
                { modelId }
            );
        }
    };
};
