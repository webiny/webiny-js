import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class BetweenOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "between";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length !== 2) {
            return;
        }

        query.whereBetween(column, [value[0] as Knex.Value, value[1] as Knex.Value]);
    }
}

export const BetweenOperator = SqlOperatorAbstraction.createImplementation({
    implementation: BetweenOperatorImpl,
    dependencies: []
});
