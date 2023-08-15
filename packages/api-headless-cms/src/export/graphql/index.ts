import { CmsGraphQLSchemaPlugin } from "~/plugins";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";

const plugin = new CmsGraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type ExportCmsStructureResponse {
            data: String
            error: CmsError
        }

        input ExportCmsStructureTargetInput {
            id: ID!
            models: [ID!]
        }

        extend type Query {
            exportCmsStructure(
                targets: [ExportCmsStructureTargetInput!]!
            ): ExportCmsStructureResponse!
        }
    `,
    resolvers: {
        Query: {
            exportCmsStructure: async (_, args, context) => {
                try {
                    const result = await context.cms.export.structure({
                        targets: args.targets
                    });
                    return new Response(JSON.stringify(result));
                } catch (ex) {
                    return new ErrorResponse(ex);
                }
            }
        }
    }
});
plugin.name = "headless-cms.graphql.export";

export const createExportGraphQL = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms.MANAGE) {
            return;
        }
        context.plugins.register(plugin);
    });
};
