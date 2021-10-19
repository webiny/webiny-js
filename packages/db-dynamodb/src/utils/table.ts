import WebinyError from "@webiny/error";
import { DbContext } from "@webiny/handler-db/types";

/**
 * Will be removed in favor of passing the table name directly to the storage operations.
 *
 * @deprecated
 */
export const getTable = <T extends DbContext>(context: T): string => {
    if (!context.db) {
        throw new WebinyError("Missing db on context.", "DB_ERROR");
    } else if (!context.db.table) {
        throw new WebinyError("Missing table on context.db.", "TABLE_ERROR");
    }
    return context.db.table;
};
