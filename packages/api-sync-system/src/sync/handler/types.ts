import type { NonEmptyArray } from "@webiny/api/types.js";
import type { DynamoDBTableType, ExtendedCommandType } from "~/types.js";
import type { ISystem } from "../types.js";

export interface IDetailItem {
    PK: string;
    SK: string;
    command: ExtendedCommandType;
    /**
     * There will be multiple tables that will get populated through the system (regular table and opensearch for start).
     */
    tableName: string;
    tableType: DynamoDBTableType;
}

export interface IDetail {
    items: NonEmptyArray<IDetailItem>;
    source: ISystem;
    id: string;
}
