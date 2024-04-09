import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createDummyLocales, createIdentity, createPermissions } from "./helpers";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { createRawEventHandler, createRawHandler } from "@webiny/handler-aws";
import { LambdaContext } from "@webiny/handler-aws/types";
import { Context } from "~tests/types";
import { PluginCollection } from "@webiny/plugins/types";
import { createBackgroundTaskContext } from "~/index";

export interface UseHandlerParams {
    plugins?: PluginCollection;
}

export const useHandler = <C extends Context = Context>(params?: UseHandlerParams) => {
    const { plugins = [] } = params || {};
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    const handler = createRawHandler<any, C>({
        plugins: [
            createWcpContext(),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: false,
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            i18nContext(),
            i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            graphQLHandlerPlugins(),
            createBackgroundTaskContext(),
            createRawEventHandler(async ({ context }) => {
                return context;
            }),
            ...plugins
        ]
    });

    return {
        handle: async () => {
            return await handler({}, {} as LambdaContext);
        }
    };
};
