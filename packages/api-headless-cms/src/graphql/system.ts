import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/api";

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
                    return context.cms.getSystemVersion();
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
/**
 * We only register system schema plugin if the endpoint is not manage/preview/read.
 */
export const createSystemSchemaPlugin = (): ContextPlugin<CmsContext> => {
    return new ContextPlugin<CmsContext>(async context => {
        if (context.cms?.type) {
            return;
        }
        context.plugins.register(plugin);
    });
};
