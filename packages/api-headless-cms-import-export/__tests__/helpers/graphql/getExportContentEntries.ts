import { IInvokeCb } from "../types";
import { createFields } from "./fields";

const query = /* GraphQL */ `
    query GetExportContentEntries($id: ID!) {
        getExportContentEntries(id: $id) {
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
