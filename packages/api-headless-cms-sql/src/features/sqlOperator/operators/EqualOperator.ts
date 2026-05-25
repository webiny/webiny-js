import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class EqualOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "eq";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (value === null) {
            query.whereNull(column);
        } else {
            query.where(column, value as Knex.Value);
        }
    }
}

export const EqualOperator = SqlOperatorAbstraction.createImplementation({
    implementation: EqualOperatorImpl,
    dependencies: []
});
