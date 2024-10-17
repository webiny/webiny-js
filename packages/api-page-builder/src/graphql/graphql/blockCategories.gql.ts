import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbContext } from "../../types";

const resolve = async (fn: () => Promise<any>): Promise<any> => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};

export const createBlockCategoryGraphQL = (): GraphQLSchemaPlugin<PbContext> => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbBlockCategory {
                    createdOn: DateTime
                    createdBy: PbIdentity
                    name: String
                    slug: String
                    icon: String
                    description: String
                }

                input PbBlockCategoryInput {
                    name: String!
                    slug: String!
                    icon: String!
                    description: String!
                }

                # Response types
                type PbBlockCategoryResponse {
                    data: PbBlockCategory
                    error: PbError
                }

                type PbBlockCategoryListResponse {
                    data: [PbBlockCategory]
                    error: PbError
                }

                extend type PbQuery {
                    getBlockCategory(slug: String!): PbBlockCategoryResponse
                    listBlockCategories: PbBlockCategoryListResponse
                }

                extend type PbMutation {
                    createBlockCategory(data: PbBlockCategoryInput!): PbBlockCategoryResponse
                    updateBlockCategory(
                        slug: String!
                        data: PbBlockCategoryInput!
                    ): PbBlockCategoryResponse
                    deleteBlockCategory(slug: String!): PbBlockCategoryResponse
                }
            `,
            resolvers: {
                PbQuery: {
                    getBlockCategory: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.getBlockCategory(args.slug);
                        });
                    },
                    listBlockCategories: async (_, __, context) => {
                        return resolve(() => context.pageBuilder.listBlockCategories());
                    }
                },
                PbMutation: {
                    createBlockCategory: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.createBlockCategory(args.data);
                        });
                    },
                    updateBlockCategory: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.updateBlockCategory(args.slug, args.data);
                        });
                    },
                    deleteBlockCategory: async (_, args: any, context) => {
                        return resolve(() => {
                            return context.pageBuilder.deleteBlockCategory(args.slug);
                        });
                    }
                }
            }
        }
    };
};
