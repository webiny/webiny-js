import { createApiCore } from "@webiny/api-core";
import createGraphQLHandler from "@webiny/handler-graphql";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { ApiCoreContext, ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createContextPlugin } from "@webiny/api";
import { Extension } from "~/api/Extension.js";
import { createTenancyAndSecurity } from "./tenancySecurity.js";

export const useHandler = () => {
    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    const handler = createHandler<any, ApiCoreContext>({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense
            }),
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity(),
            createHeadlessCmsContext(),
            createHeadlessCmsGraphQL(),
            createContextPlugin(async context => {
                Extension.register(context.container);
            }),
            createEventHandler<any, ApiCoreContext, ApiCoreContext>(async ({ context }) => {
                return context;
            })
        ]
    });

    return {
        handler: () => {
            return handler(
                {
                    headers: {
                        ["x-tenant"]: "root",
                        ["Content-Type"]: "application/json"
                    }
                } as unknown as APIGatewayEvent,
                {} as unknown as LambdaContext
            );
        }
    };
};
