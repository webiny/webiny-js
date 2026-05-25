import type { Knex } from "knex";
import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class GtOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "gt";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        query.where(column, ">", value as Knex.Value);
    }
}

export const GtOperator = SqlOperatorAbstraction.createImplementation({
    implementation: GtOperatorImpl,
    dependencies: []
});
