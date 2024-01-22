import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { CmsModel } from "~/types";

const productFields = `
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    createdBy {
        id
        displayName
        type
    }
    meta {
        title
        modelId
        version
        locked
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
    image
    inStock
    itemsInStock
    availableOn
    color
    availableSizes
    richText
    variant {
        name
        price
        images
        category {
            modelId
            entryId
            id
        }
        options {
            name
            price
            image
            category {
                modelId
                entryId
                id
            }
            categories {
                modelId
                entryId
                id
            }
            longText
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

const getProductQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetProduct($revision: ID!) {
            getProduct: get${model.singularApiName}(revision: $revision) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getProductsByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetProducts($revisions: [ID!]!) {
            getProductsByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listProductsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListProducts(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
        listProducts: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
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
};

const createProductMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateProduct($data: ${model.singularApiName}Input!) {
        createProduct: create${model.singularApiName}(data: $data) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const createProductFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateProductFrom($revision: ID!) {
            createProductFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateProductMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateProduct($revision: ID!, $data: ${model.singularApiName}Input!) {
            updateProduct: update${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const deleteProductMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteProduct($revision: ID!) {
            deleteProduct: delete${model.singularApiName}(revision: $revision) {
                data
                ${errorFields}
            }
        }
    `;
};

const publishProductMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishProduct($revision: ID!) {
            publishProduct: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const republishProductMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation RepublishProduct($revision: ID!) {
            republishProduct: republish${model.singularApiName}(revision: $revision) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

const unpublishProductMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishProduct($revision: ID!) {
            unpublishProduct: unpublish${model.singularApiName}(revision: $revision) {
                data {
                    ${productFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const useProductManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("product");

    return {
        ...contentHandler,
        async getProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductQuery(model), variables },
                headers
            });
        },
        async getProductsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getProductsByIdsQuery(model), variables },
                headers
            });
        },
        async listProducts(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listProductsQuery(model), variables },
                headers
            });
        },
        async createProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createProductMutation(model), variables },
                headers
            });
        },
        async createProductFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createProductFromMutation(model), variables },
                headers
            });
        },
        async updateProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateProductMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteProductMutation(model),
                    variables
                },
                headers
            });
        },
        async publishProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishProductMutation(model),
                    variables
                },
                headers
            });
        },
        async republishProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: republishProductMutation(model),
                    variables
                },
                headers
            });
        },

        async unpublishProduct(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishProductMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
