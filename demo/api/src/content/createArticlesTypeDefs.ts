export const createArticlesTypeDefs = (): string => {
    return /* GraphQL */ `
        type DemoArticleResponse {
            data: JSON
            error: DemoError
        }

        type DemoArticleListResponse {
            data: [JSON!]
            error: DemoError
            meta: DemoListMeta
        }

        type DemoArticleModelResponse {
            data: JSON
            error: DemoError
        }

        input DemoGetArticleWhereInput {
            slug: String!
            region: ID!
            language: ID!
        }

        input DemoListArticlesWhereInput {
            region: ID
            language: ID
        }

        extend type DemoQuery {
            getArticle(where: DemoGetArticleWhereInput): DemoArticleResponse!
            listArticles(
                search: String
                limit: Int
                after: String
                where: DemoListArticlesWhereInput
            ): DemoArticleListResponse!
        }
    `;
};
