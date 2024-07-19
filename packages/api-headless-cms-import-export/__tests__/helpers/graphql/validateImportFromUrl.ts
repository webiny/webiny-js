import { createErrorFields, createValidateImportFromUrlFields } from "./fields";
import { IInvokeCb } from "~tests/helpers/types";

const mutation = /* GraphQL */ `
    mutation ValidateImportFromUrl($data: String!) {
        validateImportFromUrl(data: $data) {
            data {
                ${createValidateImportFromUrlFields()}
            }
            ${createErrorFields()}
        }
    }
`;

export interface IValidateImportFromUrlVariables {
    data: string;
}

export const createValidateImportFromUrl = (invoke: IInvokeCb) => {
    return async (variables: IValidateImportFromUrlVariables) => {
        return invoke({
            body: {
                query: mutation,
                variables: variables
            }
        });
    };
};
