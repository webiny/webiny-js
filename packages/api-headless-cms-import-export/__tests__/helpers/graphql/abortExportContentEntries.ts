import type { IInvokeCb } from "../types";
import { createErrorFields, createExportFields } from "~tests/helpers/graphql/fields";

export interface IAbortExportContentEntriesVariables {
    id: string;
}

const query = /* GraphQL */ `
    mutation AbortExportContentEntries($id: ID!) {
        abortExportContentEntries(id: $id) {
            data {
                ${createExportFields()}
            }
            ${createErrorFields()}
        }
    }
`;

export const createAbortExportContentEntries = (invoke: IInvokeCb) => {
    return async (variables: IAbortExportContentEntriesVariables) => {
        return invoke({
            body: {
                query,
                variables
            }
        });
    };
};
