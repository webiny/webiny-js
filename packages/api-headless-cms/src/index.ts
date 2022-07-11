import { createGraphQL as baseCreateGraphQL, CreateGraphQLParams } from "~/graphql";
import { createUpgrades } from "~/upgrades";
import modelManager from "~/modelManager";
import { createCrud, CrudParams } from "~/crud";
import { createGraphQLFields } from "~/graphqlFields";
import validatorsPlugins from "~/validators";
import defaultStoragePlugin from "~/storage/default";
import objectStoragePlugin from "~/storage/object";
import {
    createContextParameterPlugin,
    createHeaderParameterPlugin,
    createPathParameterPlugin
} from "~/parameters";
import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { createContextPlugin } from "~/context";
import {
    entryFieldFromStorageTransform,
    entryFromStorageTransform,
    entryToStorageTransform
} from "./utils/entryStorage";

// export type AdminContextParams = CreateAdminCrudsParams;

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

export type CreateHeadlessCmsGraphQLParams = CreateGraphQLParams;
export const createHeadlessCmsGraphQL = (params: CreateHeadlessCmsGraphQLParams = {}) => {
    return baseCreateGraphQL(params);
};

export type ContentContextParams = CrudParams;
export const createHeadlessCmsContext = (params: ContentContextParams) => {
    return [
        breakOptionsRequestContextPlugin(),
        /**
         *
         */
        createPathParameterPlugin(),
        createContextParameterPlugin(),
        createHeaderParameterPlugin(),
        /**
         * Context for all Lambdas - everything is loaded now.
         */
        createContextPlugin(),
        modelManager(),
        /**
         *
         */
        createCrud(params),
        createGraphQLFields(),
        validatorsPlugins(),
        defaultStoragePlugin(),
        objectStoragePlugin(),
        createUpgrades()
    ];
};
export * from "~/graphqlFields";
export * from "~/plugins/CmsParametersPlugin";
export * from "~/plugins/CmsGroupPlugin";
export * from "~/plugins/CmsModelPlugin";
export * from "~/plugins/StorageTransformPlugin";
export { entryToStorageTransform, entryFieldFromStorageTransform, entryFromStorageTransform };
