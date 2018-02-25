// @flow
import type { SyncOptions } from "../types";
import SyncResult from "./syncResult";
import { Table } from "webiny-sql-table";

class Sync {
    options: SyncOptions;
    constructor(options: SyncOptions = {}) {
        this.options = options;
    }

    async execute() {
        const results = new SyncResult();
        for (let i = 0; i < this.options.tables.length; i++) {
            // const table = this.options.tables[i];
            // results = await this.__sync(new table());
        }
        return results;
    }

    async __sync(table: Table) {
        await table.create();
    }
}

export default Sync;
