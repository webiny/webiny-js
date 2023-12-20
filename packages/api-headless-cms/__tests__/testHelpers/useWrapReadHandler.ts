import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const fields = `
    id
    createdOn
    createdBy {
        id
        displayName
        type
    }
    savedOn
    # user defined fields
    title
    references {
        ... on CategoryApiNameWhichIsABitDifferentThanModelId {
            id
            modelId
        }
        ... on AuthorApiModel {
            id
            modelId
        }
        ... on ProductApiSingular {
            id
            modelId
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

const listWrapsQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query ListWraps(
            $where: ${model.singularApiName}ListWhereInput
        $sort: [${model.singularApiName}ListSorter]
        $limit: Int
        $after: String
        ) {
            listWraps: list${model.pluralApiName}(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    ${fields}
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

export const useWrapReadHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("wrap");

    return {
        ...contentHandler,
        async listWraps(variables?: Record<string, any>) {
            return await contentHandler.invoke({
                body: {
                    query: listWrapsQuery(model),
                    variables
                }
            });
        }
    };
};
