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
import { createContextPlugin } from "~/context";
import {
    entryFieldFromStorageTransform,
    entryFromStorageTransform,
    entryToStorageTransform
} from "./utils/entryStorage";
import { createFieldConverters } from "~/fieldConverters";

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
        baseCreateGraphQL(params)
    ];
};

export type ContentContextParams = CrudParams;
export const createHeadlessCmsContext = (params: ContentContextParams) => {
    return [
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
        createFieldConverters(),
        createValidators(),
        createDefaultStorageTransform(),
        createObjectStorageTransform(),
        createUpgrades()
    ];
};
export * from "~/graphqlFields";
export * from "~/plugins";
export { entryToStorageTransform, entryFieldFromStorageTransform, entryFromStorageTransform };
