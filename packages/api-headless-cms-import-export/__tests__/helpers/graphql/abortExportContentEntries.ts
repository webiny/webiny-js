import { IInvokeCb } from "../types";
import { createFields } from "~tests/helpers/graphql/fields";

export interface IAbortExportContentEntriesVariables {
    id: string;
}

const query = /* GraphQL */ `
    mutation AbortExportContentEntries($id: ID!) {
        abortExportContentEntries(id: $id) {
            data {
                ${createFields()}
            }
            error {
                code
                message
                data
            }
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
