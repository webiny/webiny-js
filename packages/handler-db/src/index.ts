import { Db } from "@webiny/db";
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "./types";

export default args => {
    return [
        {
            type: "context",
            apply(context) {
                if (context.db) {
                    return;
                }
                context.db = new Db(args);
            }
        } as ContextPlugin<DbContext>
    ];
};
