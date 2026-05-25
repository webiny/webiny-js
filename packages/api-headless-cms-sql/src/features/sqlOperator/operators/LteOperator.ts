import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class LteOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "lte";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        query.where(column, "<=", value as Knex.Value);
    }
}

export const LteOperator = SqlOperatorAbstraction.createImplementation({
    implementation: LteOperatorImpl,
    dependencies: []
});
