import { createCmsExtension } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { createIdentity } from "./helpers.js";
import { createPermissions } from "./helpers.js";
import type { PermissionsArg } from "./helpers.js";
import { createHandler } from "@webiny/handler-aws";
import type { APIGatewayEvent } from "@webiny/handler-aws/types";
import type { LambdaContext } from "@webiny/handler-aws/types";
import type { PluginCollection } from "@webiny/plugins/types";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createRegisterExtensionPlugin } from "@webiny/handler/plugins/RegisterExtensionPlugin.js";
import { Extension } from "~/api/Extension.js";
import { NoopTaskServiceFeature } from "./NoopTaskService.js";
import { noopTaskService } from "./NoopTaskService.js";
import { TestWebhookProviderFeature } from "./TestWebhookProvider.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface UseGraphQLHandlerParams {
    plugins?: PluginCollection;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
}

interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQLHandler = (params?: UseGraphQLHandlerParams) => {
    const { plugins = [] } = params || {};
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const webhookPlugin = createRegisterExtensionPlugin(context => {
        NoopTaskServiceFeature.register(context.container);
        TestWebhookProviderFeature.register(context.container);
        Extension.register(context.container);
    });

    webhookPlugin.name = "test-graphql-webhooks-extension-plugin";

    const handler = createHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
            }),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                permissions: createPermissions(params?.permissions),
                identity: createIdentity(params?.identity)
            }),
            createCmsExtension(),
            graphQLHandlerPlugins(),
            webhookPlugin,
            ...plugins
        ],
        debug: false
    });

    const invoke = async <T = any>({
        httpMethod = "POST",
        body,
        headers = {}
    }: InvokeParams): Promise<[T, any]> => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body)
            } as unknown as APIGatewayEvent,
            {} as unknown as LambdaContext
        );
        return [JSON.parse(response.body || "{}"), response];
    };

    return {
        invoke,
        noopTaskService
    };
};
