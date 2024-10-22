import { ConstructorArgs, Db } from "@webiny/db";
import { ContextPlugin } from "@webiny/api";
import { DbContext } from "./types";

export default <T = unknown>(args: ConstructorArgs<T>) => {
    return [
        new ContextPlugin<DbContext>(context => {
            if (context.db) {
                return;
            }
            context.db = new Db<T>(args);
        })
    ];
};
