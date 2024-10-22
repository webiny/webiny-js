import { Db } from "@webiny/db";
import { Context } from "@webiny/api/types";

export interface DbContext extends Context {
    db: Db<unknown>;
}
