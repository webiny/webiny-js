import { IInvokeCb } from "../types";
import { createFields } from "./fields";

export interface IStartExportContentEntriesVariables {
    modelId: string;
    limit?: number;
}

const query = /* GraphQL */ `
    mutation StartExportContentEntries($modelId: ExportContentEntriesModelsListEnum!, $limit: Int) {
        startExportContentEntries(modelId: $modelId, limit: $limit) {
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

export const createStartExportContentEntries = (invoke: IInvokeCb) => {
    return async (variables: IStartExportContentEntriesVariables) => {
        return invoke({
            body: {
                query,
                variables
            }
        });
    };
};
