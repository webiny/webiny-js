import type { IInvokeCb } from "../types";
import { createErrorFields, createExportFields } from "./fields";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { getModel } from "~tests/mocks/model";

export interface IExportContentEntriesVariables {
    modelId: string;
    limit?: number;
}

const createQuery = (model: Pick<CmsModel, "pluralApiName">): string => {
    return /* GraphQL */ `
        mutation Export${model.pluralApiName}ContentEntries($limit: Int) {
            expor${model.pluralApiName}tContentEntries(limit: $limit) {
                data {
                    ${createExportFields()}
                }
                ${createErrorFields()}
            }
        }
    `;
};

export const createExportContentEntries = (invoke: IInvokeCb) => {
    return async (variables: IExportContentEntriesVariables) => {
        const modelId = variables.modelId;
        // @ts-expect-error
        delete variables.modelId;

        return invoke({
            body: {
                query: createQuery(getModel(modelId)),
                variables
            }
        });
    };
};
