export default /* GraphQL */ `
    "Product category"
    type CmsManageCategory {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        title: CmsManageText
    }

    input CmsManageCategoryInput {
        title: CmsManageTextInput
    }

    input CmsManageCategoryFilterInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]

        # Matches if the field is equal to the given value
        title: String

        # Matches if the field is not equal to the given value
        title_not: String

        # Matches if the field exists
        title_exists: Boolean

        # Matches if the field value equal one of the given values
        title_in: [String]

        # Matches if the field value does not equal any of the given values
        title_not_in: [String]

        # Matches if given value is a substring of the the field value
        title_contains: String

        # Matches if given value is not a substring of the the field value
        title_not_contains: String
    }

    type CmsManageCategoryResponse {
        data: CmsManageCategory
        error: CmsError
    }

    type CmsManageCategoryListResponse {
        data: [CmsManageCategory]
        meta: CmsListMeta
        error: CmsError
    }

    extend type CmsManageQuery {
        getCategory(id: ID, locale: String): CmsManageCategoryResponse

        listCategories(
            locale: String
            page: Int
            perPage: Int
            sort: JSON
            where: CmsManageCategoryFilterInput
        ): CmsManageCategoryListResponse
    }

    extend type CmsManageMutation {
        createCategory(data: CmsManageCategoryInput!): CmsManageCategoryResponse
        updateCategory(id: ID!, data: CmsManageCategoryInput!): CmsManageCategoryResponse
        deleteCategory(id: ID!): CmsDeleteResponse
    }
`;
