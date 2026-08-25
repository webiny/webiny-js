import { createAbstraction } from "@webiny/feature/api";
import type { Knex } from "knex";
import type { ISyncRow } from "~/types.js";

export interface ISyncRowQuery {
    create(): Knex.QueryBuilder<ISyncRow>;
}

export const SyncRowQuery = createAbstraction<ISyncRowQuery>("Cms/Pg/Os/SyncWriter/SyncRowQuery");

export namespace SyncRowQuery {
    export type Interface = ISyncRowQuery;
}
