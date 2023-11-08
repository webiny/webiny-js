import createGraphQLHandler from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createEventHandler, createHandler } from "@webiny/handler-aws/raw";
import { AcoContext } from "~/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createAco } from "~/index";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createIdentity } from "./identity";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const handler = createHandler<any, AcoContext>({
        plugins: [
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || createIdentity() }),
            i18nContext(),
            ...i18nStorage.storageOperations,
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createAco(),
            createEventHandler<any, AcoContext, AcoContext>(async ({ context }) => {
                return context;
            }),
            plugins
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
