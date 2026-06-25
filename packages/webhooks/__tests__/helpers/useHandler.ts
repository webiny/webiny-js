import { createCmsExtension } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { createIdentity, createPermissions } from "./helpers.js";
import type { PermissionsArg } from "./helpers.js";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { Extension } from "~/api/Extension.js";
import { NoopTaskServiceFeature, noopTaskService } from "./NoopTaskService.js";
import { TestWebhookProviderFeature } from "./TestWebhookProvider.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { BuildParam } from "@webiny/api-core/features/buildParams/index.js";

export interface UseHandlerParams {
    plugins?: PluginCollection;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    encryptionPassphrase?: string;
}

function createEncryptionBuildParam(passphrase: string) {
    class EncryptionPassphraseBuildParam implements BuildParam.Interface {
        public readonly key = "EncryptionPassphrase";
        public readonly value = passphrase;
    }

    return BuildParam.createImplementation({
        implementation: EncryptionPassphraseBuildParam,
        dependencies: []
    });
}

export const useHandler = (params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const webhookPlugin = createRegisterExtensionPlugin(context => {
        if (params?.encryptionPassphrase) {
            context.container.register(createEncryptionBuildParam(params.encryptionPassphrase));
        }

        /* Register noop external services before the webhooks Extension. */
        NoopTaskServiceFeature.register(context.container);
        TestWebhookProviderFeature.register(context.container);

        /* Register all webhooks features. */
        Extension.register(context.container);
    });

    webhookPlugin.name = "test-context-webhooks-extension-plugin";

    const handler = createRawHandler<any, any>({
        plugins: [
            apiCoreStorage.storageOperations,
            createApiCore(),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                permissions: createPermissions(params?.permissions),
                identity: createIdentity(params?.identity)
            }),
            createCmsExtension(),
            graphQLHandlerPlugins(),
            webhookPlugin,
            createRawEventHandler(async ({ context }) => {
                return context;
            }),
            ...plugins
        ]
    });

    return {
        handle: async (payload?: Record<string, any>) => {
            const headers = {
                ["x-tenant"]: "root",
                ...(payload?.headers || {})
            };
            return await handler(
                {
                    ...payload,
                    headers
                },
                {} as LambdaContext
            );
        },
        noopTaskService
    };
};
