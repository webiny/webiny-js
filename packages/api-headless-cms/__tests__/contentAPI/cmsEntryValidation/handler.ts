import { GraphQLHandlerParams, useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { createModel } from "~tests/contentAPI/cmsEntryValidation/mocks/structure";
import { CmsApiModel } from "~/plugins";

const ERROR = `
error {
    message
    data
    code
    stack
}
`;

const validateMutation = (model: CmsApiModel) => {
    return /* GraphQL */ `
        mutation ValidateProduct($revision: ID, $data: ${model.singularApiName}Input!) {
            validateProduct: validate${model.singularApiName}(revision: $revision, data: $data) {
                data
                ${ERROR}
            }
        }
    `;
};

export const useValidationManageHandler = (params: Partial<GraphQLHandlerParams>) => {
    const contentHandler = useGraphQLHandler({
        path: "manage/en-US",
        ...params
    });

    const model = createModel();

    return {
        ...contentHandler,
        async validate(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: validateMutation(model),
                    variables
                },
                headers
            });
        }
    };
};
