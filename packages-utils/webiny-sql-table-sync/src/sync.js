// @flow
import type { SyncOptions } from "../types";
import SyncResult from "./syncResult";
import SyncResults from "./syncResults";

import { Table } from "webiny-sql-table";

class Sync {
    options: SyncOptions;
    constructor(options: SyncOptions = {}) {
        this.options = options;
    }

    async execute() {
        const results = new SyncResults();
        for (let i = 0; i < this.options.tables.length; i++) {
            const result = new SyncResult();

            const table = this.options.tables[i];
            results = await this.__sync(new table());
        }
        return results;
    }

    async __sync(table: Table) {
        await table.create();
    }
}

export default Sync;
