import type { IEntryEntity } from "~/definitions/types.js";

export interface IDataLoaderParams {
    entity: IEntryEntity;
    tenant: string;
    modelId: string;
}
