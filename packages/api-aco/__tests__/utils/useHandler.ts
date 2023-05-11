import createGraphQLHandler from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { createHandler, createEventHandler } from "@webiny/handler-aws/raw";
import { AcoContext } from "~/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createAco } from "~/index";
import { createStorageOperations } from "./storageOperations";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createIdentity } from "./identity";

export interface UseHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
}

export const useHandler = (params: UseHandlerParams = {}) => {
    const { permissions, identity, plugins = [], storageOperationPlugins } = params;

    const ops = createStorageOperations({
        plugins: storageOperationPlugins || []
    });

    const handler = createHandler<any, AcoContext>({
        plugins: [
            ...ops.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || createIdentity() }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: ops.storageOperations
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
            return handler({} as any, {} as any);
        }
    };
};
