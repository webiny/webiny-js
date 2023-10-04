import { GraphQLHandlerParams, useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { CmsApiModel } from "~/plugins";

const ERROR = `
error {
    message
    data
    code
    stack
}
`;

const validateMutation = (model: Pick<CmsApiModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation ValidateProduct($revision: ID, $data: ${model.singularApiName}Input!) {
        validate: validate${model.singularApiName}(revision: $revision, data: $data) {
                data
                ${ERROR}
            }
        }
    `;
};

interface Params extends Partial<GraphQLHandlerParams> {
    model: Pick<CmsApiModel, "singularApiName">;
}

export const useValidationManageHandler = (params: Params) => {
    const contentHandler = useGraphQLHandler({
        path: "manage/en-US",
        ...params
    });

    return {
        ...contentHandler,
        async validate(variables: Record<string, any>, headers: Record<string, any> = {}) {
            return await contentHandler.invoke({
                body: {
                    query: validateMutation(params.model),
                    variables
                },
                headers
            });
        }
    };
};
