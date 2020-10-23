import { Db } from "@webiny/db";
import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";

export default (args) => {
    return [
        {
            type: "context",
            apply(context) {
                if (context.db) {
                    return;
                }
                context.db = new Db(args);
            }
        } as HandlerContextPlugin<HandlerContextDb>
    ];
};
