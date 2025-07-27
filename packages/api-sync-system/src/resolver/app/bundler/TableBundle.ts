/**
 * This will bundle records by system and table.
 *
 * It will be used to fetch the data from the source system tables.
 */
import type { IBundle } from "./types.js";
import type { IIngestorResultItem } from "../ingestor/types";
import type { IBaseBundleParams } from "./BaseBundle.js";
import { BaseBundle } from "./BaseBundle.js";

export class TableBundle extends BaseBundle {
    public canAdd(item: IIngestorResultItem): boolean {
        return this.source.name === item.source.name && this.table.name === item.table.name;
    }
}

export const createTableBundle = (params: IBaseBundleParams): IBundle => {
    return new TableBundle(params);
};
