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
    isSomething
    rating
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

export const useFruitReadHandler = (params: GraphQLHandlerParams) => {
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
        async listFruits(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listFruitsQuery(model), variables },
                headers
            });
        }
    };
};
