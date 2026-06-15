import type { Db } from "@webiny/db";
import type { Context } from "@webiny/api/types.js";

export interface DbContext extends Context {
    db: Db<unknown>;
}
