import { Db } from "@webiny/db";
import { ContextInterface } from "@webiny/handler/types";

export interface DbContext extends ContextInterface {
    db: Db;
}
