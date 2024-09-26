import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { GenericRecord } from "@webiny/api/types";

const identityFields = /* GraphQL */ `
    {
        id
        displayName
        type
    }
`;

const categoryFields = `
    id
    entryId
    createdOn
    modifiedOn
    savedOn
    firstPublishedOn
    lastPublishedOn
    deletedOn
    restoredOn
    createdBy ${identityFields}
    modifiedBy ${identityFields}
    savedBy ${identityFields}
    deletedBy ${identityFields}
    restoredBy ${identityFields}
    # user fields
    title
    slug
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const getCategoryQuery = (model: CmsModel) => {
    return /* GraphQL */ `
        query GetCategory {
            getCategory: get${model.singularApiName} {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

const updateCategoryMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation UpdateCategory($data: ${model.singularApiName}Input!) {
            updateCategory: update${model.singularApiName}(data: $data) {
                data {
                    ${categoryFields}
                }
                ${errorFields}
            }
        }
    `;
};

export const useSingletonCategoryHandler = (params: GraphQLHandlerParams) => {
    const model = getCmsModel("categorySingleton");
    const contentHandler = useGraphQLHandler(params);

    return {
        ...contentHandler,
        async getCategory(headers: GenericRecord<string> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: getCategoryQuery(model)
                },
                headers
            });
        },
        async updateCategory(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: updateCategoryMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
