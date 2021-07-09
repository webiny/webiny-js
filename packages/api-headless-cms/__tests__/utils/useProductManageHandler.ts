import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableArgs } from "./useGqlHandler";

const productFields = `
    id
    createdOn
    createdBy {
        id
        displayName
        type
    }
    savedOn
    meta {
        title
        modelId
        version
        locked
        publishedOn
        status
        revisions {
            id
            title
        }
    }
    # user defined fields
    title
    category {
        modelId
        entryId
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
    query GetProduct($revision: ID!) {
        getProduct(revision: $revision) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;

const getProductsByIdsQuery = /* GraphQL */ `
    query GetProducts($revisions: [ID!]!) {
        getProductsByIds(revisions: $revisions) {
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

const createProductMutation = /* GraphQL */ `
    mutation CreateProduct($data: ProductInput!) {
        createProduct(data: $data) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;

const createProductFromMutation = /* GraphQL */ `
    mutation CreateProductFrom($revision: ID!) {
        createProductFrom(revision: $revision) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;

const updateProductMutation = /* GraphQL */ `
    mutation UpdateProduct($revision: ID!, $data: ProductInput!) {
        updateProduct(revision: $revision, data: $data) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;

const deleteProductMutation = /* GraphQL */ `
    mutation DeleteProduct($revision: ID!) {
        deleteProduct(revision: $revision) {
            data
            ${errorFields}
        }
    }
`;

const publishProductMutation = /* GraphQL */ `
    mutation PublishProduct($revision: ID!) {
        publishProduct(revision: $revision) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;

const unpublishProductMutation = /* GraphQL */ `
    mutation UnpublishProduct($revision: ID!) {
        unpublishProduct(revision: $revision) {
            data {
                ${productFields}
            }
            ${errorFields}
        }
    }
`;

export const useProductManageHandler = (options: GQLHandlerCallableArgs) => {
    const contentHandler = useContentGqlHandler(options);

    return {
        ...contentHandler,
        async getProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductQuery, variables },
                headers
            });
        },
        async getProductsByIds(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductsByIdsQuery, variables },
                headers
            });
        },
        async listProducts(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listProductsQuery, variables },
                headers
            });
        },
        async createProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createProductMutation, variables },
                headers
            });
        },
        async createProductFrom(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createProductFromMutation, variables },
                headers
            });
        },
        async updateProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateProductMutation,
                    variables
                },
                headers
            });
        },
        async deleteProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteProductMutation,
                    variables
                },
                headers
            });
        },
        async publishProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishProductMutation,
                    variables
                },
                headers
            });
        },
        async unpublishProduct(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishProductMutation,
                    variables
                },
                headers
            });
        }
    };
};
