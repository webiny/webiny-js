import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (value === null) {
            query.whereNotNull(column);
        } else {
            query.whereNot(column, value as Knex.Value);
        }
    }
}

export const NotOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotOperatorImpl,
    dependencies: []
});
