// @flow
import { MySQLTable } from "webiny-api";
import { Sync, ConsoleLog } from "webiny-sql-table-sync";
import {
    PageTable,
    CategoryTable,
    WidgetTable,
    RevisionTable,
    LayoutTable
} from "webiny-api-cms/lib/mysql";
import FileTable from "webiny-api/src/mysql/file.mysql";
import ImageTable from "webiny-api/src/mysql/image.mysql";

// Configure MySQLTable driver
import { connection } from "./../../app/database";

MySQLTable.getDriver().setConnection(connection);

export default async () => {
    //const tables = [PageTable, CategoryTable, FileTable, ImageTable, WidgetTable, RevisionTable, LayoutTable];
    const tables = [LayoutTable];

    const sync = new Sync({
        tables,
        drop: true,
        logClass: ConsoleLog
    });
    await sync.execute();

    const { default: importer } = await import("./import");
    return importer();
};
