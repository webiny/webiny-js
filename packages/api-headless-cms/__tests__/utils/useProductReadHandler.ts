import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableArgs } from "./useGqlHandler";

const productFields = `
    id
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
        options {
            name
            price
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

export const useProductReadHandler = (options: GQLHandlerCallableArgs) => {
    const contentHandler = useContentGqlHandler(options);

    return {
        ...contentHandler,
        async getProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductQuery, variables },
                headers
            });
        },
        async listProducts(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listProductsQuery, variables },
                headers
            });
        }
    };
};
