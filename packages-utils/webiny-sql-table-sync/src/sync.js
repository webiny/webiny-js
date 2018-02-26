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
            const table = this.options.tables[i];
            results.push(await this.__sync(new table()));
        }
        return results;
    }

    async __sync(table: Table): Promise<SyncResult> {
        const sql = await table.create({ returnSQL: true });
        if (this.options.preview) {
            console.log("asd");
            console.log(sql);
        }
        return new SyncResult({ sql });
    }
}

export default Sync;
