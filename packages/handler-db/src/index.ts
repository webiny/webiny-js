import { Db } from "@webiny/db";
import { ContextPlugin } from "@webiny/handler";
import { DbContext } from "./types";

/**
 * TODO: remove this package.
 */
export default (args: any) => {
    return [
        new ContextPlugin<DbContext>(context => {
            if (context.db) {
                return;
            }
            context.db = new Db(args);
        })
    ];
};
