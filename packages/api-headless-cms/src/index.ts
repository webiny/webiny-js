import { createGraphQL as baseCreateGraphQL, CreateGraphQLParams } from "~/graphql";
import { createUpgrades } from "~/upgrades";
import { createDefaultModelManager } from "~/modelManager";
import { createCrud, CrudParams } from "~/crud";
import { createGraphQLFields } from "~/graphqlFields";
import { createValidators } from "~/validators";
import { createDefaultStorageTransform } from "~/storage/default";
import { createObjectStorageTransform } from "~/storage/object";
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
    return [
        breakOptionsRequestContextPlugin(),
        /**
         * PathParameter plugins are used to determine the type of the cms endpoint
         */
        createPathParameterPlugin(),
        createHeaderParameterPlugin(),
        createContextParameterPlugin(),
        /**
         * At this point we can create, or not create, CMS GraphQL Schema.
         */
        baseCreateGraphQL(params)
    ];
};

export type ContentContextParams = CrudParams;
export const createHeadlessCmsContext = (params: ContentContextParams) => {
    return [
        breakOptionsRequestContextPlugin(),
        /**
         * Context for all Lambdas - everything is loaded now.
         */
        createContextPlugin(),
        createDefaultModelManager(),
        /**
         *
         */
        createCrud(params),
        createGraphQLFields(),
        createValidators(),
        createDefaultStorageTransform(),
        createObjectStorageTransform(),
        createUpgrades()
    ];
};
export * from "~/graphqlFields";
export * from "~/plugins";
export { entryToStorageTransform, entryFieldFromStorageTransform, entryFromStorageTransform };
