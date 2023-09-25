import { createGraphQL as baseCreateGraphQL, CreateGraphQLParams } from "~/graphql";
import { createDefaultModelManager } from "~/modelManager";
import { createGraphQLFields } from "~/graphqlFields";
import { createValidators } from "~/validators";

import { createDynamicZoneStorageTransform } from "~/graphqlFields/dynamicZone/dynamicZoneStorage";
import {
    createContextParameterPlugin,
    createHeaderParameterPlugin,
    createPathParameterPlugin
} from "~/parameters";
import { createContextPlugin, CrudParams } from "~/context";
import {
    entryFieldFromStorageTransform,
    entryFromStorageTransform,
    entryToStorageTransform
} from "./utils/entryStorage";
import { createFieldConverters } from "~/fieldConverters";
import { createStorageTransformPlugins } from "~/storage";

export type CreateHeadlessCmsGraphQLParams = CreateGraphQLParams;
export const createHeadlessCmsGraphQL = (params: CreateHeadlessCmsGraphQLParams = {}) => {
    return [
        /**
         * PathParameter plugins are used to determine the type of the cms endpoint
         */
        createPathParameterPlugin(),
        createHeaderParameterPlugin(),
        createContextParameterPlugin(),
        /**
         * At this point we can create, or not create, CMS GraphQL Schema.
         */
        ...baseCreateGraphQL(params)
    ];
};

export type ContentContextParams = CrudParams;
export const createHeadlessCmsContext = (params: ContentContextParams) => {
    return [
        /**
         * Context for all Lambdas - everything is loaded now.
         */
        createContextPlugin(params),
        createDefaultModelManager(),
        createGraphQLFields(),
        createFieldConverters(),
        createValidators(),
        createStorageTransformPlugins(),
        createDynamicZoneStorageTransform()
    ];
};
export * from "~/graphqlFields";
export * from "~/plugins";
export * from "~/utils/incrementEntryIdVersion";
export * from "~/utils/access";
export * from "./graphql/handleRequest";
export { entryToStorageTransform, entryFieldFromStorageTransform, entryFromStorageTransform };
