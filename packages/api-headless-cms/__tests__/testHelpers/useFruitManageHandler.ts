import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const fruitFields = `
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
            name
        }
    }
    # user defined fields
    name
    numbers
    email
    url
    lowerCase
    upperCase
    date
    dateTime
    dateTimeZ
    time
    rating
    isSomething
    description
    slug
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getFruitQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetFruit($revision: ID!) {
            getFruit: get${model.singularApiName}(revision: $revision) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

const getFruitsByIdsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetFruits($revisions: [ID!]!) {
            getFruitsByIds: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

const listFruitsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListFruits(
            $where: ${model.singularApiName}ListWhereInput
            $sort: [${model.singularApiName}ListSorter]
            $limit: Int
            $after: String
        ) {
            listFruits: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    ${fruitFields}
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

const createFruitMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateFruit($data: ${model.singularApiName}Input!) {
            createFruit: create${model.singularApiName}(data: $data) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

const createFruitFromMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateFruitFrom($revision: ID!) {
            createFruitFrom: create${model.singularApiName}From(revision: $revision) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateFruitMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateFruit($revision: ID!, $data: ${model.singularApiName}Input!) {
            updateFruit: update${model.singularApiName}(revision: $revision, data: $data) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

const deleteFruitMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation DeleteFruit($revision: ID!, $options: CmsDeleteEntryOptions) {
            deleteFruit: delete${model.singularApiName}(revision: $revision, options: $options) {
                data
                ${errorFields}
            }
        }
    `;
};

const publishFruitMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishFruit($revision: ID!) {
            publishFruit: publish${model.singularApiName}(revision: $revision) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

const unpublishFruitMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UnpublishFruit($revision: ID!) {
            unpublishFruit: unpublish${model.singularApiName}(revision: $revision) {
                data {
                    ${fruitFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const useFruitManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("fruit");

    return {
        ...contentHandler,
        async getFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getFruitQuery(model), variables },
                headers
            });
        },
        async getFruitsByIds(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getFruitsByIdsQuery(model), variables },
                headers
            });
        },
        async listFruits(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listFruitsQuery(model), variables },
                headers
            });
        },
        async createFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createFruitMutation(model), variables },
                headers
            });
        },
        async createFruitFrom(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: createFruitFromMutation(model), variables },
                headers
            });
        },
        async updateFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateFruitMutation(model),
                    variables
                },
                headers
            });
        },
        async deleteFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: deleteFruitMutation(model),
                    variables
                },
                headers
            });
        },
        async publishFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishFruitMutation(model),
                    variables
                },
                headers
            });
        },
        async unpublishFruit(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: unpublishFruitMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
