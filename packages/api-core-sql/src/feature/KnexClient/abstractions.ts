import { createAbstraction } from "@webiny/feature/api";
import type { Knex } from "knex";

export interface IKnexClient {
    getKnex(): Knex;
}

export const KnexClient = createAbstraction<IKnexClient>("Db/Sql/KnexClient");

export namespace KnexClient {
    export type Interface = IKnexClient;
}
