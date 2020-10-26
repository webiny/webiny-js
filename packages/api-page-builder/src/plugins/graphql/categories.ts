import { hasScope } from "@webiny/api-security";
import { Response, NotFoundResponse } from "@webiny/graphql";

export default {
    typeDefs: /* GraphQL */ `
        type PbCategory {
            id: ID
            createdOn: DateTime
            name: String
            slug: String
            url: String
            layout: String
        }

        input PbCategoryInput {
            id: ID
            name: String
            slug: String
            url: String
            layout: String
        }

        # Response types
        type PbCategoryResponse {
            data: PbCategory
            error: PbError
        }

        type PbCategoryListResponse {
            data: [PbCategory]
            meta: PbListMeta
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
            getCategory: hasScope("pb.category")(async (_, args, context) => {
                const { categories } = context;
                const category = await categories.get(args.slug);
                if (!category) {
                    return new NotFoundResponse(`Category "${args.slug}" not found.`);
                }

                return new Response(category);
            }),
            listCategories: hasScope("pb.category")(async (_, args, context) => {
                const { categories } = context;
                return new Response(await categories.list());
            })
        },
        PbMutation: {
            createCategory: hasScope("pb.category")(async (_, args, context) => {
                const { categories } = context;
                const { data } = args;

                if (await categories.get(data.slug)) {
                    return new NotFoundResponse(
                        `Category with slug "${data.slug}" already exists.`
                    );
                }

                await categories.create(data);
                return new Response(data);
            }),
            updateCategory: hasScope("pb.category")(async (_, args, context) => {
                const { categories } = context;
                const { slug, data } = args;

                let category = await categories.get(slug);
                if (!category) {
                    return new NotFoundResponse(`Category "${slug}" not found.`);
                }

                await categories.update(data);

                category = await categories.get(slug);
                return new Response(category);
            }),
            deleteCategory: hasScope("pb.category")(async (_, args, context) => {
                const { categories } = context;
                const { slug } = args;

                const category = await categories.get(slug);
                if (!category) {
                    return new NotFoundResponse(`Category "${args.slug}" not found.`);
                }

                await categories.delete(slug);

                return new Response(category);
            })
        }
    }
};
