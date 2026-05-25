import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotBetweenOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not_between";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length !== 2) {
            return;
        }

        query.whereNotBetween(column, [value[0] as Knex.Value, value[1] as Knex.Value]);
    }
}

export const NotBetweenOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotBetweenOperatorImpl,
    dependencies: []
});
