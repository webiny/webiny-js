export default /* GraphQL */ `
    "Product category"
    type Category {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        meta: CategoryMeta
        title: CmsText
        slug: CmsText
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
        title: CmsText
    }

    input CategoryInput {
        title: CmsTextInput
        slug: CmsTextInput
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
            before: String
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
