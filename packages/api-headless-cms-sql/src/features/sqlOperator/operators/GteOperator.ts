import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class GteOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "gte";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        query.where(column, ">=", value as Knex.Value);
    }
}

export const GteOperator = SqlOperatorAbstraction.createImplementation({
    implementation: GteOperatorImpl,
    dependencies: []
});
