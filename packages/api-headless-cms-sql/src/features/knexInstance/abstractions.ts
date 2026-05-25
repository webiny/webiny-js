import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api/index.js";

export type IKnexInstance = Knex;

export const KnexInstanceAbstraction = createAbstraction<IKnexInstance>("Cms/Sql/KnexInstance");

export namespace KnexInstanceAbstraction {
    export type Interface = IKnexInstance;
}
