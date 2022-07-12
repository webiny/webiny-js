import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

const productFields = `
    id
    entryId
    createdOn
    savedOn
    # user defined fields
    title
    category {
        id
        title
    }
    price
    inStock
    itemsInStock
    availableOn
    color
    availableSizes
    richText
    variant {
        name
        price
        category {
            id
            title
        }
        options {
            name
            price
            category {
                id
                title
            }
        }
    }
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getProductQuery = /* GraphQL */ `
    query GetProduct($where: ProductGetWhereInput!) {
        getProduct(where: $where) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;
const listProductsQuery = /* GraphQL */ `
    query ListProducts(
        $where: ProductListWhereInput
        $sort: [ProductListSorter]
        $limit: Int
        $after: String
    ) {
        listProducts(where: $where, sort: $sort, limit: $limit, after: $after) {
            data {
                ${productFields}
            }
            meta {
                cursor
                hasMoreItems
                totalCount
            }
            ${errorFields}
        }
    }
`;

export const useProductReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductQuery, variables },
                headers
            });
        },
        async listProducts(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listProductsQuery, variables },
                headers
            });
        }
    };
};
