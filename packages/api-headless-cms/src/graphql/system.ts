import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { ContextPlugin } from "@webiny/handler";

const emptyResolver = () => ({});

const plugin: GraphQLSchemaPlugin<CmsContext> = {
    name: "cms.graphql.schema.system",
    type: "graphql-schema",
    schema: {
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

                # Upgrade CMS
                upgrade(version: String!): CmsBooleanResponse
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
                },
                upgrade: async (_: any, args: any, { cms }: CmsContext) => {
                    const { version } = args;
                    try {
                        await cms.upgradeSystem(version);
                        return new Response(true);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            }
        }
    }
};
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
