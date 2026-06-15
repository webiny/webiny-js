import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createRevisionIdScalarPlugin } from "~/graphql/scalars/RevisionIdScalarPlugin.js";
import {
    createContextParameterPlugin,
    createHeaderParameterPlugin,
    createPathParameterPlugin
} from "~/parameters/index.js";
import { createGraphQL as baseCreateGraphQL, type CreateGraphQLParams } from "~/graphql/index.js";
import { createExportGraphQL } from "~/export/index.js";
import { createContextPlugin } from "~/context.js";
import { createFieldConverters } from "~/fieldConverters/index.js";

export type ICreateCmsExtensionParams = CreateGraphQLParams;

export const createCmsExtension = (params: ICreateCmsExtensionParams = {}) => {
    return createRegisterExtensionPlugin(async context => {
        context.plugins.register([
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
            //
            createContextPlugin(),
            createFieldConverters()
        ]);
    });
};
