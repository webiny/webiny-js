import type { CmsModel } from "~/types/index.js";
import { ERROR_FIELDS, type IGraphQLErrorResponse } from "~tests/testHelpers/fields/index.js";

export interface IMoveCategoryMutationVariables {
    revision: string;
    folderId: string;
}

export interface IMoveCategoryMutationResponse {
    moveCategory: {
        data: boolean | null;
        error: IGraphQLErrorResponse | null;
    };
}

export const moveCategoryMutation = (model: Pick<CmsModel, "singularApiName">) => {
    return /* GraphQL */ `
        mutation MoveCategory($revision: ID!, $folderId: ID!) {
            moveCategory: move${model.singularApiName}(revision: $revision, folderId: $folderId) {
                data
                error ${ERROR_FIELDS}
            }
        }
    `;
};
