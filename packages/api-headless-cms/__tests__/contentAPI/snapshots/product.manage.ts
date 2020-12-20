import { revisionsComment } from "./snippets";

export default /* GraphQL */ `
    """
    Products being sold in our webshop
    """
    type Product {
        id: ID
        createdOn: DateTime
        savedOn: DateTime
        meta: ProductMeta
        title: String
        category: Category
        price: Number
        inStock: Boolean
        itemsInStock: Number
        availableOn: String
    }

    type ProductMeta {
        modelId: String
        version: Int
        locked: Boolean
        publishedOn: DateTime
        status: String
        ${revisionsComment}
        revisions: [Product]
        title: String
    }

    input ProductInput {
        title: String
        category: RefInput
        price: Number
        inStock: Boolean
        itemsInStock: Number
        availableOn: String
    }

    input ProductGetWhereInput {
        id: ID
        title: String
        price: Number
        inStock: Boolean
        itemsInStock: Number
        availableOn: String
    }

    input ProductListWhereInput {
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

        price: Number
        price_not: Number
        price_in: [Number]
        price_not_in: [Number]
        price_lt: Number
        price_lte: Number
        price_gt: Number
        price_gte: Number

        inStock: Boolean
        inStock_not: Boolean

        itemsInStock: Number
        itemsInStock_not: Number
        itemsInStock_in: [Number]
        itemsInStock_not_in: [Number]
        itemsInStock_lt: Number
        itemsInStock_lte: Number
        itemsInStock_gt: Number
        itemsInStock_gte: Number

        availableOn: String
        availableOn_not: String
        availableOn_in: [String]
        availableOn_not_in: [String]
        availableOn_lt: String
        availableOn_lte: String
        availableOn_gt: String
        availableOn_gte: String
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
        title_ASC
        title_DESC
        price_ASC
        price_DESC
        inStock_ASC
        inStock_DESC
        itemsInStock_ASC
        itemsInStock_DESC
        availableOn_ASC
        availableOn_DESC
    }

    extend type Query {
        getProduct(where: ProductGetWhereInput!): ProductResponse

        listProducts(
            where: ProductListWhereInput
            sort: [ProductListSorter]
            limit: Int
            after: String
        ): ProductListResponse
    }

    extend type Mutation {
        createProduct(data: ProductInput!): ProductResponse

        createProductFrom(revision: ID!, data: ProductInput): ProductResponse

        updateProduct(revision: ID!, data: ProductInput!): ProductResponse

        deleteProduct(revision: ID!): CmsDeleteResponse

        publishProduct(revision: ID!): ProductResponse

        unpublishProduct(revision: ID!): ProductResponse
    }
`;
