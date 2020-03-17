export default /* GraphQL */ `
    "Product category"
    type CmsReadCategory {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        title(locale: String): String
        slug(locale: String): String
    }

    input CmsReadCategoryGetWhereInput {
        id: ID
        slug: String
    }

    input CmsReadCategoryListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]

        # Matches if the field is equal to the given value
        title: String

        # Matches if the field is not equal to the given value
        title_not: String

        # Matches if the field value equal one of the given values
        title_in: [String]

        # Matches if the field value does not equal any of the given values
        title_not_in: [String]

        # Matches if given value is a substring of the the field value
        title_contains: String

        # Matches if given value is not a substring of the the field value
        title_not_contains: String

        # Matches if the field is equal to the given value
        slug: String

        # Matches if the field is not equal to the given value
        slug_not: String

        # Matches if the field value equal one of the given values
        slug_in: [String]

        # Matches if the field value does not equal any of the given values
        slug_not_in: [String]

        # Matches if given value is a substring of the the field value
        slug_contains: String

        # Matches if given value is not a substring of the the field value
        slug_not_contains: String
    }

    enum CmsReadCategoryListSorter {
        createdOn_ASC
        createdOn_DESC
        updatedOn_ASC
        updatedOn_DESC
        title_ASC
        title_DESC
        slug_ASC
        slug_DESC
    }

    type CmsReadCategoryResponse {
        data: CmsReadCategory
        error: CmsError
    }

    type CmsReadCategoryListResponse {
        data: [CmsReadCategory]
        meta: CmsListMeta
        error: CmsError
    }

    extend type CmsReadQuery {
        getCategory(locale: String, where: CmsReadCategoryGetWhereInput!): CmsReadCategoryResponse

        listCategories(
            locale: String
            page: Int
            perPage: Int
            where: CmsReadCategoryListWhereInput
            sort: [CmsReadCategoryListSorter]
        ): CmsReadCategoryListResponse
    }
`;