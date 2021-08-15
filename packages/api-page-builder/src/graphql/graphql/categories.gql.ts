import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { PbContext } from "../../types";

const resolve = async fn => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbCategory {
                createdOn: DateTime
                createdBy: PbCreatedBy
                name: String
                slug: String
                url: String
                layout: String
            }

            input PbCategoryInput {
                name: String!
                slug: String!
                url: String!
                layout: String!
            }

            # Response types
            type PbCategoryResponse {
                data: PbCategory
                error: PbError
            }

            type PbCategoryListResponse {
                data: [PbCategory]
                error: PbError
            }

            extend type PbQuery {
                getCategory(slug: String!): PbCategoryResponse
                listCategories: PbCategoryListResponse

                "Returns category by given slug."
                getCategoryBySlug(slug: String!): PbCategoryResponse
            }

            extend type PbMutation {
                createCategory(data: PbCategoryInput!): PbCategoryResponse
                updateCategory(slug: String!, data: PbCategoryInput!): PbCategoryResponse
                deleteCategory(slug: String!): PbCategoryResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getCategory: async (_, args: { slug: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.categories.get(args.slug);
                    });
                },
                listCategories: async (_, args, context) => {
                    return resolve(() => context.pageBuilder.categories.list());
                }
            },
            PbMutation: {
                createCategory: async (_, args: { data: Record<string, any> }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.categories.create(args.data);
                    });
                },
                updateCategory: async (
                    _,
                    args: { slug: string; data: Record<string, any> },
                    context
                ) => {
                    return resolve(() => {
                        return context.pageBuilder.categories.update(args.slug, args.data);
                    });
                },
                deleteCategory: async (_, args: { slug: string }, context) => {
                    return resolve(() => {
                        return context.pageBuilder.categories.delete(args.slug);
                    });
                }
            }
        }
    }
};

export default plugin;
