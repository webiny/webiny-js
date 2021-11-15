import { useContentGqlHandler } from "./useContentGqlHandler";
import { GQLHandlerCallableParams } from "./useGqlHandler";

const fruitFields = `
    id
    createdOn
    createdBy {
        id
        displayName
        type
    }
    savedOn
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
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getFruitQuery = /* GraphQL */ `
    query GetFruit($revision: ID!) {
        getFruit(revision: $revision) {
            data {
                ${fruitFields}
            }
            ${errorFields}
        }
    }
`;

const listFruitsQuery = /* GraphQL */ `
    query ListFruits(
        $where: FruitListWhereInput
        $sort: [FruitListSorter]
        $limit: Int
        $after: String
    ) {
        listFruits(where: $where, sort: $sort, limit: $limit, after: $after) {
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

export const useFruitReadHandler = (
    params: Omit<GQLHandlerCallableParams, "createHeadlessCmsApp">
) => {
    const contentHandler = useContentGqlHandler(params);

    return {
        ...contentHandler,
        async getFruit(variables, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: getFruitQuery, variables },
                headers
            });
        },
        async listFruits(variables = {}, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: { query: listFruitsQuery, variables },
                headers
            });
        }
    };
};
