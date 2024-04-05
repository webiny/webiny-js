import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

const emptyResolver = () => ({});

const plugin = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        extend type Query {
            cms: CmsQuery
        }

        extend type Mutation {
            cms: CmsMutation
        }

        type CmsQuery {
            _empty: String
        }

        type CmsMutation {
            _empty: String
        }
        extend type CmsQuery {
            # Get installed version
            version: String
        }

        extend type CmsMutation {
            # Install CMS
            install: CmsBooleanResponse
        }
    `,
    resolvers: {
        Query: {
            cms: emptyResolver
        },
        Mutation: {
            cms: emptyResolver
        },
        CmsQuery: {
            version: async (_: any, __: any, context: CmsContext) => {
                try {
                    const version = await context.cms.getSystemVersion();
                    return version ? "true" : null;
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsMutation: {
            install: async (_: any, __: any, { cms }: CmsContext) => {
                try {
                    const version = await cms.getSystemVersion();
                    if (version) {
                        return new ErrorResponse({
                            code: "CMS_INSTALLATION_ERROR",
                            message: "CMS is already installed."
                        });
                    }

                    await cms.installSystem();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
plugin.name = "cms.graphql.schema.system";

export const createSystemSchemaPlugin = () => {
    return plugin;
};
