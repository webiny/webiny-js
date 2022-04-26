import { createGraphQLPlugin } from "~/plugins/graphql";
import { createAdminCruds, CreateAdminCrudsParams } from "~/plugins/crud";
import context from "~/plugins/context";
import upgrades from "~/plugins/upgrades";
import contextSetup from "~/content/contextSetup";
import modelManager from "~/content/plugins/modelManager";
import { createContentCruds, CreateContentCrudsParams } from "~/content/plugins/crud";
import fieldTypePlugins from "~/content/plugins/graphqlFields";
import validatorsPlugins from "~/content/plugins/validators";
import defaultStoragePlugin from "~/content/plugins/storage/default";
import objectStoragePlugin from "~/content/plugins/storage/object";
import {
    CreateGraphQLHandlerOptions,
    graphQLHandlerFactory
} from "~/content/graphQLHandlerFactory";
import { StorageTransformPlugin } from "~/content/plugins/storage/StorageTransformPlugin";
import { createParametersPlugins, CreateParametersPluginsParams } from "~/content/parameterPlugins";
import { CmsParametersPlugin } from "~/content/plugins/CmsParametersPlugin";
import { CmsGroupPlugin } from "~/content/plugins/CmsGroupPlugin";
import { CmsModelPlugin } from "~/content/plugins/CmsModelPlugin";
import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";
import { getWebinyVersionHeaders } from "@webiny/utils";

export type AdminContextParams = CreateAdminCrudsParams;

const DEFAULT_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Content-Type": "application/json",
    ...getWebinyVersionHeaders()
};

const DEFAULT_CACHE_MAX_AGE = 30758400; // 1 year

const OPTIONS_HEADERS: Record<string, string> = {
    "Access-Control-Max-Age": `${DEFAULT_CACHE_MAX_AGE}`,
    "Cache-Control": `public, max-age=${DEFAULT_CACHE_MAX_AGE}`
};

const breakOptionsRequestContextPlugin = (): ContextPlugin<CmsContext> => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const method = (context.http?.request?.method || "").toLowerCase();
        if (method !== "options") {
            return;
        }
        context.setResult({
            statusCode: 204,
            body: "",
            headers: {
                ...DEFAULT_HEADERS,
                ...OPTIONS_HEADERS
            }
        });
    });
    plugin.name = "break-options-request";

    return plugin;
};

export const createAdminHeadlessCmsContext = (params: AdminContextParams) => {
    return [breakOptionsRequestContextPlugin(), context(), createAdminCruds(params), upgrades()];
};

export const createAdminHeadlessCmsGraphQL = () => {
    return createGraphQLPlugin();
};

export interface ContentContextParams
    extends CreateContentCrudsParams,
        CreateParametersPluginsParams {}
export const createContentHeadlessCmsContext = (params: ContentContextParams) => {
    return [
        breakOptionsRequestContextPlugin(),
        createParametersPlugins(params),
        contextSetup(),
        modelManager(),
        createContentCruds(params),
        fieldTypePlugins(),
        validatorsPlugins(),
        defaultStoragePlugin(),
        objectStoragePlugin()
        // new InternalAuthenticationPlugin("read-api-key"),
        // new InternalAuthorizationPlugin("read-api-key")
    ];
};
export type ContentGraphQLParams = CreateGraphQLHandlerOptions;
export const createContentHeadlessCmsGraphQL = (params?: ContentGraphQLParams) => {
    return graphQLHandlerFactory(params);
};

export { StorageTransformPlugin, CmsParametersPlugin, CmsGroupPlugin, CmsModelPlugin };
