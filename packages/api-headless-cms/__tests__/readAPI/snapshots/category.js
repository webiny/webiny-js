export default /* GraphQL */ `
    "Product category"
    type Category {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        title(locale: String): String
        slug(locale: String): String
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

    enum CategoryListSorter {
        id_ASC
        id_DESC
        title_ASC
        title_DESC
        slug_ASC
        slug_DESC
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

    extend type Query {
        getCategory(locale: String, where: CategoryGetWhereInput!): CategoryResponse

        listCategories(
            locale: String
            where: CategoryListWhereInput
            sort: [CategoryListSorter]
            limit: Int
            after: String
            before: String
        ): CategoryListResponse
    }
`;
