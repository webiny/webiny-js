export default /* GraphQL */ `
    """
    Products being sold in our webshop
    """
    type Product {
        id: ID
        createdOn: DateTime
        updatedOn: DateTime
        savedOn: DateTime
        title(locale: String): String
        category(locale: String): Category
        price(locale: String): Number
        inStock(locale: String): Boolean
        itemsInStock(locale: String): Number
        availableOn(locale: String): String
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

    enum ProductListSorter {
        id_ASC
        id_DESC
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

    extend type Query {
        getProduct(locale: String, where: ProductGetWhereInput!): ProductResponse

        listProducts(
            locale: String
            where: ProductListWhereInput
            sort: [ProductListSorter]
            limit: Int
            after: String
            before: String
        ): ProductListResponse
    }
`;
