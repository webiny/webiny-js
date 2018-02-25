// @flow
import { Sync } from "./..";

import { Table } from "webiny-sql-table";

class TableA extends Table {}

class TableB extends Table {}

const sync = new Sync({
    tables: [TableA, TableB],
    preview: true
});

describe("empty database test", function() {
    /*it("should create tables since they do not exist", async () => {
        await sync.execute();
    });*/

    it("should create tables - return SQL since the flag is set to true", async () => {
        const results = await sync.execute();
    });
});
