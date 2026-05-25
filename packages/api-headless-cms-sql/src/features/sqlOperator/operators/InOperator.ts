import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class InOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "in";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (!Array.isArray(value) || value.length === 0) {
            return;
        }

        query.whereIn(column, value as Knex.Value[]);
    }
}

export const InOperator = SqlOperatorAbstraction.createImplementation({
    implementation: InOperatorImpl,
    dependencies: []
});
