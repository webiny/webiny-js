import type { StorageKey } from "@webiny/db/types.js";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";

export interface ICreateStoreKeyParams {
    modelId: string;
    tenant: string;
}

export const createStoreNamespace = (params: Pick<ICreateStoreKeyParams, "tenant">) => {
    return `deletingCmsModel#T#${params.tenant}#`;
};

export const createStoreKey = (params: ICreateStoreKeyParams): StorageKey => {
    return `${createStoreNamespace(params)}${params.modelId}`;
};

export const createStoreValue = (params: IStoreValue): IStoreValue => {
    return {
        modelId: params.modelId,
        task: params.task,
        identity: params.identity,
        tenant: params.tenant
    };
};
