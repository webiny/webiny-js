import { GraphQLHandlerParams, useGraphQLHandler } from "./useGraphQLHandler";
import { CmsModel } from "~/types";
import { getCmsModel } from "~tests/contentAPI/mocks/contentModels";

const fields = `
    id
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
    }
    # user defined fields
    title
    references {
        modelId
        id
        entryId
    }
`;

const errorFields = `
    error {
        code
        message
        data
    }
`;

const createWrapMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation CreateWrap($data: ${model.singularApiName}Input!) {
        createWrap: create${model.singularApiName}(data: $data) {
        data {
        ${fields}
        }
        ${errorFields}
        }
        }
    `;
};

const publishWrapMutation = (model: CmsModel) => {
    return /* GraphQL */ `
        mutation PublishWrap($revision: ID!) {
            publishWrap: publish${model.singularApiName}(revision: $revision) {
            data {
                ${fields}
            }
            ${errorFields}
        }
        }
    `;
};

export const useWrapManageHandler = (params: GraphQLHandlerParams) => {
    const contentHandler = useGraphQLHandler(params);

    const model = getCmsModel("wrap");

    return {
        ...contentHandler,
        async createWrap(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: createWrapMutation(model),
                    variables
                },
                headers
            });
        },
        async publishWrap(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: publishWrapMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
