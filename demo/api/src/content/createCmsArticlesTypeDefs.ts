export const createCmsArticlesTypeDefs = (): string => {
    return /* GraphQL */ `
        type ArticleCloneResponse {
            data: Article
            error: CmsError
        }

        extend type Mutation {
            cloneArticle(id: ID!, language: ID!): ArticleCloneResponse
        }
    `;
};
