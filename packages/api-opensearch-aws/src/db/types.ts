import type { IEntity, IStandardEntityAttributes } from "@webiny/db-dynamodb";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IOpenSearchEntityAttributes extends IStandardEntityAttributes<GenericRecord> {
    index: string;
}

export type IOpenSearchEntity = IEntity<IOpenSearchEntityAttributes>;
