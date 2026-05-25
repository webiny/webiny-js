import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api/index.js";

export type IKnexInstance = Knex;

export const KnexInstance = createAbstraction<IKnexInstance>("Cms/Sql/KnexInstance");

export namespace KnexInstance {
    export type Interface = IKnexInstance;
}
