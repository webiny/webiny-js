import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";

const productFields = `
    id
    entryId
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
        id
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
            modelId
            entryId
            id
        }
        options {
            name
            price
            category {
                modelId
                entryId
                id
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

const republishProductMutation = /* GraphQL */ `
    mutation RepublishProduct($revision: ID!) {
        republishProduct(revision: $revision) {
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

export const useProductManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductQuery, variables },
                headers
            });
        },
        async getProductsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductsByIdsQuery, variables },
                headers
            });
        },
        async listProducts(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listProductsQuery, variables },
                headers
            });
        },
        async createProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createProductMutation, variables },
                headers
            });
        },
        async createProductFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createProductFromMutation, variables },
                headers
            });
        },
        async updateProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateProductMutation,
                    variables
                },
                headers
            });
        },
        async deleteProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteProductMutation,
                    variables
                },
                headers
            });
        },
        async publishProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishProductMutation,
                    variables
                },
                headers
            });
        },
        async republishProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: republishProductMutation,
                    variables
                },
                headers
            });
        },

        async unpublishProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
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
