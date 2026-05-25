import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api/index.js";

export interface ISqlOperatorApplyParams {
    query: Knex.QueryBuilder;
    column: string;
    value: unknown;
}

export interface ISqlOperator {
    readonly operator: string;
    apply(params: ISqlOperatorApplyParams): void;
}

export const SqlOperator = createAbstraction<ISqlOperator>("Cms/Sql/Operator");

export namespace SqlOperator {
    export type Interface = ISqlOperator;
    export type ApplyParams = ISqlOperatorApplyParams;
}
