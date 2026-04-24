import type { TableConstructor } from "~/toolbox.js";
import { Table as BaseTable } from "~/toolbox.js";
import type {
    ITable,
    ITableReadBatch,
    ITableScanParams,
    ITableScanResponse,
    ITableWriteBatch
} from "./types.js";
import { createTableWriteBatch } from "./TableWriteBatch.js";
import { createTableReadBatch } from "./TableReadBatch.js";
import { scan } from "../scan.js";

export class Table<
    Name extends string = string,
    PartitionKey extends string = string,
    SortKey extends string = string
> implements ITable<Name, PartitionKey, SortKey> {
    public readonly table: BaseTable<Name, PartitionKey, SortKey>;

    public constructor(params: TableConstructor<Name, PartitionKey, SortKey>) {
        this.table = new BaseTable(params);
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
        return scan<T>({
            ...params,
            table: this.table
        });
    }
}
