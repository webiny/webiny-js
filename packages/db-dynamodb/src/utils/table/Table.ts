import type { TableConstructor } from "~/toolbox.js";
import { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type {
    ITable,
    ITableReadBatch,
    ITableScanParams,
    ITableScanResponse,
    ITableWriteBatch
} from "./types.js";
import { createTableWriteBatch } from "./TableWriteBatch.js";
import { createTableReadBatch } from "./TableReadBatch.js";

export class Table implements ITable {
    public readonly table: DynamoDocClient;

    public constructor(params: TableConstructor) {
        this.table = new DynamoDocClient({
            documentClient: params.DocumentClient,
            tableName: params.name
        });
    }

    public createWriter(): ITableWriteBatch {
        return createTableWriteBatch({
            table: this.table
        });
    }

    public createReader(): ITableReadBatch {
        return createTableReadBatch({
            table: this.table
        });
    }

    public async scan<T>(params: ITableScanParams): Promise<ITableScanResponse<T>> {
        return this.table.scan<T>(params);
    }
}
