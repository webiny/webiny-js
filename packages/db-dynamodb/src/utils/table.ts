import WebinyError from "@webiny/error";
import { DbContext } from "@webiny/handler-db/types";

export const getTable = <T extends DbContext>(context: T): string => {
    if (!context.db) {
        throw new WebinyError("Missing db on context.", "DB_ERROR");
    } else if (!context.db.table) {
        throw new WebinyError("Missing table on context.db.", "TABLE_ERROR");
    }
    return context.db.table;
};
