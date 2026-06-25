import type { IEntity } from "@webiny/db-dynamodb";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb/exports/api/db.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IOpenSearchEntityAttributes extends IStandardEntityAttributes<GenericRecord> {
    index: string;
}

export type IOpenSearchEntity = IEntity<IOpenSearchEntityAttributes>;
