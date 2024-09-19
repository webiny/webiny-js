import { createErrorFields, createValidateImportFromUrlFields } from "./fields";
import type { IInvokeCb } from "~tests/helpers/types";

const mutation = /* GraphQL */ `
    mutation ImportFromUrl($id: ID!) {
        importFromUrl(id: $id) {
            data {
                ${createValidateImportFromUrlFields()}
            }
            ${createErrorFields()}
        }
    }
`;

export interface IImportFromUrlVariables {
    id: string;
}

export const createImportFromUrl = (invoke: IInvokeCb) => {
    return async (variables: IImportFromUrlVariables) => {
        return invoke({
            body: {
                query: mutation,
                variables: variables
            }
        });
    };
};
