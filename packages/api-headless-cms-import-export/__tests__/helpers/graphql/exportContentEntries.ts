import { IInvokeCb } from "../types";
import { createFields } from "./fields";

export interface IExportContentEntriesVariables {
    modelId: string;
    limit?: number;
}

const query = /* GraphQL */ `
    mutation ExportContentEntries($modelId: ExportContentEntriesModelsListEnum!, $limit: Int) {
        exportContentEntries(modelId: $modelId, limit: $limit) {
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

export const createExportContentEntries = (invoke: IInvokeCb) => {
    return async (variables: IExportContentEntriesVariables) => {
        return invoke({
            body: {
                query,
                variables
            }
        });
    };
};
