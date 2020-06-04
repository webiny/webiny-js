export default /* GraphQL */ `
    "Products being sold in our webshop"
    type CmsRefProductCategoryLocalized {
        value: Category
        locale: ID!
    }

    type CmsRefProductCategory {
        value(locale: String): Category
        values: [CmsRefProductCategoryLocalized]!
    }

    type CmsRefProductReviewsLocalized {
        value: Review
        locale: ID!
    }

    type CmsRefProductReviews {
        value(locale: String): Review
        values: [CmsRefProductReviewsLocalized]!
    }
    type Product {
        id: ID
        createdBy: SecurityUser
        updatedBy: SecurityUser
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        meta: ProductMeta
        title: CmsText
        category: CmsRefProductCategory
        reviews: CmsRefProductReviews
        price: CmsNumber
        inStock: CmsBoolean
        itemsInStock: CmsNumber
        availableOn: CmsDate
    }

    type ProductMeta {
        model: String
        environment: ID
        parent: ID
        version: Int
        latestVersion: Boolean
        locked: Boolean
        published: Boolean
        publishedOn: DateTime
        status: String
        revisions: [Product]
        title: CmsText
    }

    input ProductInput {
        title: CmsTextInput
        category: CmsRefInput
        reviews: CmsRefInput
        price: CmsNumberInput
        inStock: CmsBooleanInput
        itemsInStock: CmsNumberInput
        availableOn: CmsDateInput
    }

    input ProductGetWhereInput {
        id: ID
    }

    input ProductListWhereInput {
        id: ID
        id_not: ID
        id_in: [ID]
        id_not_in: [ID]
    }

    input ProductUpdateWhereInput {
        id: ID
    }

    input ProductDeleteWhereInput {
        id: ID
    }

    type ProductResponse {
        data: Product
        error: CmsError
    }

    type ProductListResponse {
        data: [Product]
        meta: CmsListMeta
        error: CmsError
    }

    enum ProductListSorter {
        id_ASC
        id_DESC
    }

    extend type Query {
        getProduct(where: ProductGetWhereInput!): ProductResponse

        listProducts(
            where: ProductListWhereInput
            sort: [ProductListSorter]
            limit: Int
            after: String
            before: String
        ): ProductListResponse
    }

    extend type Mutation {
        createProduct(data: ProductInput!): ProductResponse

        createProductFrom(revision: ID!, data: ProductInput): ProductResponse

        updateProduct(where: ProductUpdateWhereInput!, data: ProductInput!): ProductResponse

        deleteProduct(where: ProductDeleteWhereInput!): CmsDeleteResponse

        publishProduct(revision: ID!): ProductResponse

        unpublishProduct(revision: ID!): ProductResponse
    }
`;
