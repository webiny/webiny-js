import { Db } from "@webiny/db";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { DbContext } from "./types";

export default args => {
    return [
        new ContextPlugin<DbContext>(context => {
            if (context.db) {
                return;
            }
            context.db = new Db(args);
        })
    ];
};
