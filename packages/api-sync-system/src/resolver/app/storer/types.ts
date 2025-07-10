import type { IDeployment } from "~/resolver/deployment/types.js";
import type { ITable } from "~/sync/types.js";
import type { CommandType } from "~/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { IBundle } from "../bundler/types";

export type StoreItemPossibleValues =
    | string
    | number
    | boolean
    | undefined
    | null
    | GenericRecord
    | StoreItemPossibleValues[];

export interface IStoreItem {
    PK: string;
    SK: string;
    [key: string]: StoreItemPossibleValues;
}

export interface IStorerExecParams {
    deployment: IDeployment;
    bundle: IBundle;
    command: CommandType;
    table: ITable;
    items: IStoreItem[];
}

export interface IStorer {
    store(params: IStorerExecParams): Promise<void>;
}
