import { createGraphQL as baseCreateGraphQL, CreateGraphQLParams } from "~/graphql";
import { createDefaultModelManager } from "~/modelManager";
import { createGraphQLFields } from "~/graphqlFields";
import { createValidators } from "~/validators";
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
import { createExportGraphQL } from "~/export";
import { createStorageTransform } from "~/storage";
import { createLexicalHTMLRenderer } from "./htmlRenderer/createLexicalHTMLRenderer";
import { createRevisionIdScalarPlugin } from "~/graphql/scalars/RevisionIdScalarPlugin";
import { Plugin } from "@webiny/plugins/types";

export * from "./utils/isHeadlessCmsReady";
export * from "./utils/createModelField";
export * from "./graphql/schema/resolvers/manage/normalizeGraphQlInput";

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
        createExportGraphQL(),
        createLexicalHTMLRenderer()
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
        ...createStorageTransform()
    ];
};
export * from "~/graphqlFields";
export * from "~/plugins";
export * from "~/utils/incrementEntryIdVersion";
export * from "~/utils/RichTextRenderer";
export * from "./graphql/handleRequest";
export * from "./utils/contentEntryTraverser/ContentEntryTraverser";
export * from "./utils/contentModelAst";
export { entryToStorageTransform, entryFieldFromStorageTransform, entryFromStorageTransform };
