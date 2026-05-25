import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotInOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not_in";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length === 0) {
            return;
        }

        query.whereNotIn(column, value as Knex.Value[]);
    }
}

export const NotInOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotInOperatorImpl,
    dependencies: []
});
