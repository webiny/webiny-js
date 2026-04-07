import type { CreateGraphQLParams } from "~/graphql/index.js";
import { createGraphQL as baseCreateGraphQL } from "~/graphql/index.js";
import {
    createContextParameterPlugin,
    createHeaderParameterPlugin,
    createPathParameterPlugin
} from "~/parameters/index.js";
import { createContextPlugin } from "~/context.js";
import {
    entryFieldFromStorageTransform,
    entryFromStorageTransform,
    entryToStorageTransform
} from "./utils/entryStorage.js";
import { createFieldConverters } from "~/fieldConverters/index.js";
import { createExportGraphQL } from "~/export/index.js";
import { createStorageTransform } from "~/storage/index.js";
import { createRevisionIdScalarPlugin } from "~/graphql/scalars/RevisionIdScalarPlugin.js";
import type { Plugin } from "@webiny/plugins/types.js";

export * from "./utils/isHeadlessCmsReady.js";
export * from "./utils/createModelField.js";
export * from "./graphql/schema/resolvers/manage/normalizeGraphQlInput.js";

export type CreateHeadlessCmsGraphQLParams = CreateGraphQLParams;
export const createHeadlessCmsGraphQL = (params: CreateHeadlessCmsGraphQLParams = {}): Plugin[] => {
    return [
        ...createRevisionIdScalarPlugin(),
        /**
         * PathParameter plugins are used to determine the type of the cms endpoint
         */
        createPathParameterPlugin(),
        createHeaderParameterPlugin(),
        createContextParameterPlugin(),
        /**
         * At this point we can create, or not create, CMS GraphQL Schema.
         */
        ...baseCreateGraphQL(params),
        createExportGraphQL()
    ];
};

export const createHeadlessCmsContext = () => {
    return [
        /**
         * Context for all Lambdas - everything is loaded now.
         */
        createContextPlugin(),
        createFieldConverters(),
        ...createStorageTransform()
    ];
};
export * from "~/plugins/index.js";
export * from "~/utils/incrementEntryIdVersion.js";
export * from "./graphql/handleRequest.js";
export * from "./features/contentEntry/ContentEntryTraverser/ContentEntryTraverser.js";
export { ContentEntryTraverserProvider } from "./features/contentEntry/ContentEntryTraverser/abstractions.js";
export * from "./utils/contentModelAst/index.js";
export { CmsWhereMapper } from "~/features/whereMapper/abstractions.js";
export { CmsSortMapper } from "~/features/sortMapper/abstractions.js";
export { entryToStorageTransform, entryFieldFromStorageTransform, entryFromStorageTransform };
