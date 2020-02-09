export default /* GraphQL */ `
    "Products being sold in our webshop"
    type CmsManageProduct {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        title: CmsManageText
        category: CmsManageRefOne
        reviews: CmsManageRefMany
        price: CmsManageInt
        availableOn: CmsManageDate
    }

    input CmsManageProductInput {
        title: CmsManageTextInput
        category: CmsManageRefOneInput
        reviews: CmsManageRefManyInput
        price: CmsManageIntInput
        availableOn: CmsManageDateInput
    }

    input CmsManageProductFilterInput {
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

        # Matches if the field is equal to the given value
        price: Int

        # Matches if the field is not equal to the given value
        price_not: Int

        # Matches if the field exists
        price_exists: Boolean

        # Matches if the field value equal one of the given values
        price_in: [Int]

        # Matches if the field value does not equal any of the given values
        price_not_in: [Int]

        # Matches if the field value is strictly smaller than the given value
        price_lt: Int

        # Matches if the field value is smaller than or equal to the given value
        price_lte: Int

        # Matches if the field value is strictly greater than the given value
        price_gt: Int

        # Matches if the field value is greater than or equal to the given value
        price_gte: Int

        # Matches if the field is equal to the given value
        availableOn: String

        # Matches if the field is not equal to the given value
        availableOn_not: String

        # Matches if the field exists
        availableOn_exists: Boolean

        # Matches if the field value equal one of the given values
        availableOn_in: [String]

        # Matches if the field value does not equal any of the given values
        availableOn_not_in: [String]

        # Matches if the field value is strictly smaller than the given value
        availableOn_lt: String

        # Matches if the field value is smaller than or equal to the given value
        availableOn_lte: String

        # Matches if the field value is strictly greater than the given value
        availableOn_gt: String

        # Matches if the field value is greater than or equal to the given value
        availableOn_gte: String
    }

    type CmsManageProductResponse {
        data: CmsManageProduct
        error: CmsError
    }

    type CmsManageProductListResponse {
        data: [CmsManageProduct]
        meta: CmsListMeta
        error: CmsError
    }

    extend type CmsManageQuery {
        getProduct(id: ID, locale: String): CmsManageProductResponse

        listProducts(
            locale: String
            page: Int
            perPage: Int
            sort: JSON
            where: CmsManageProductFilterInput
        ): CmsManageProductListResponse
    }

    extend type CmsManageMutation {
        createProduct(data: CmsManageProductInput!): CmsManageProductResponse
        updateProduct(id: ID!, data: CmsManageProductInput!): CmsManageProductResponse
        deleteProduct(id: ID!): CmsDeleteResponse
    }
`;
