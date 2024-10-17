import { createErrorFields, createValidateImportFromUrlFields } from "./fields";
import type { IInvokeCb } from "~tests/helpers/types";

const query = /* GraphQL */ `
    query GetValidateImportFromUrl($id: ID!) {
        getValidateImportFromUrl(id: $id) {
            data {
                ${createValidateImportFromUrlFields()}
            }
            ${createErrorFields()}
        }
    }
`;

export interface IGetValidateImportFromUrlVariables {
    id: string;
}

export const createGetValidateImportFromUrl = (invoke: IInvokeCb) => {
    return async (variables: IGetValidateImportFromUrlVariables) => {
        return invoke({
            body: {
                query,
                variables
            }
        });
    };
};
