import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class LtOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "lt";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        query.where(column, "<", value as Knex.Value);
    }
}

export const LtOperator = SqlOperatorAbstraction.createImplementation({
    implementation: LtOperatorImpl,
    dependencies: []
});
