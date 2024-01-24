import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const productFields = `
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    lastPublishedOn
    firstPublishedOn
    # user defined fields
    title
    category {
        id
        title
    }
    image
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
        images
        category {
            id
            title
        }
        options {
            name
            price
            image
            longText
            category {
                id
                title
            }
            categories {
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

const getProductQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetProduct($where: ${model.singularApiName}GetWhereInput!) {
            getProduct: get${model.singularApiName}(where: $where) {
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

export const useProductReadHandler = (params: GraphQLHandlerParams) => {
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
        async listProducts(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listProductsQuery(model), variables },
                headers
            });
        }
    };
};
