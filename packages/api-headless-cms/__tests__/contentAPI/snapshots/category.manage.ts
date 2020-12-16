export default /* GraphQL */ `
    """
    Product category
    """
    type Category {
        id: ID
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        meta: CategoryMeta
        title: String
        slug: String
    }

    type CategoryMeta {
        model: String
        environment: ID
        parent: ID
        version: Int
        latestVersion: Boolean
        locked: Boolean
        published: Boolean
        publishedOn: DateTime
        status: String
        revisions: [Category]
        title: String
    }

    input CategoryInput {
        title: String
        slug: String
    }

    input CategoryGetWhereInput {
        id: ID
        title: String
        slug: String
    }

    input CategoryListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]

        title: String
        title_not: String
        title_in: [String]
        title_not_in: [String]
        title_contains: String
        title_not_contains: String

        slug: String
        slug_not: String
        slug_in: [String]
        slug_not_in: [String]
        slug_contains: String
        slug_not_contains: String
    }

    input CategoryUpdateWhereInput {
        id: ID
        title: String
        slug: String
    }

    input CategoryDeleteWhereInput {
        id: ID
        title: String
        slug: String
    }

    type CategoryResponse {
        data: Category
        error: CmsError
    }

    type CategoryListResponse {
        data: [Category]
        meta: CmsListMeta
        error: CmsError
    }

    enum CategoryListSorter {
        id_ASC
        id_DESC
        title_ASC
        title_DESC
        slug_ASC
        slug_DESC
    }

    extend type Query {
        getCategory(where: CategoryGetWhereInput!): CategoryResponse

        listCategories(
            where: CategoryListWhereInput
            sort: [CategoryListSorter]
            limit: Int
            after: String
        ): CategoryListResponse
    }

    extend type Mutation {
        createCategory(data: CategoryInput!): CategoryResponse

        createCategoryFrom(revision: ID!, data: CategoryInput): CategoryResponse

        updateCategory(where: CategoryUpdateWhereInput!, data: CategoryInput!): CategoryResponse

        deleteCategory(where: CategoryDeleteWhereInput!): CmsDeleteResponse

        publishCategory(revision: ID!): CategoryResponse

        unpublishCategory(revision: ID!): CategoryResponse
    }
`;
