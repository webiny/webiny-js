import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotContainsOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not_contains";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string" || value.trim().length === 0) {
            return;
        }

        query.whereRaw("LOWER(??) NOT LIKE LOWER(?)", [column, `%${value}%`]);
    }
}

export const NotContainsOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotContainsOperatorImpl,
    dependencies: []
});
