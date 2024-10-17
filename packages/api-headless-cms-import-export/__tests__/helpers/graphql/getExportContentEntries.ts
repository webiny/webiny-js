import type { IInvokeCb } from "../types";
import { createErrorFields, createExportFields } from "./fields";

const query = /* GraphQL */ `
    query GetExportContentEntries($id: ID!) {
        getExportContentEntries(id: $id) {
            data {
                ${createExportFields()}
            }
            ${createErrorFields()}
        }
    }
`;

export interface IGetExportContentEntriesVariables {
    id: string;
}

export const createGetExportContentEntries = (invoke: IInvokeCb) => {
    return async (variables: IGetExportContentEntriesVariables) => {
        return invoke({
            body: {
                query,
                variables: variables
            }
        });
    };
};
