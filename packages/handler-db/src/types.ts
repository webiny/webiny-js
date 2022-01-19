import { Db } from "@webiny/db";
import { Context } from "@webiny/handler/types";

export interface DbContext extends Context {
    db: Db;
}
