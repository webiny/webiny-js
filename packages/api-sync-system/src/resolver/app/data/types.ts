import type { ITable } from "~/sync/types.js";
import type { IDeployment } from "~/resolver/deployment/types.js";
import { GenericRecord } from "@webiny/api/types.js";
import type { IStoreItem } from "~/resolver/app/storer/types.js";

export interface IInputItem {
    PK: string;
    SK: string;
    table: Pick<ITable, "name">;
    source: Pick<IDeployment, "name">;
}

export interface IItem {
    PK: string;
    SK: string;
    table: Pick<ITable, "name">;
    source: Pick<IDeployment, "name">;
    data: IStoreItem | null;
}

export interface ISourceDataContainer {
    items: GenericRecord<string, IItem>;
    get(item: IInputItem): IStoreItem | null;
    add(item: IInputItem, data: IStoreItem | null): void;
    merge(container: ISourceDataContainer): void;
}
