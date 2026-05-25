import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class NotStartsWithOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "not_startsWith";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string" || value.trim().length === 0) {
            return;
        }

        query.whereRaw("LOWER(??) NOT LIKE LOWER(?)", [column, `${value}%`]);
    }
}

export const NotStartsWithOperator = SqlOperatorAbstraction.createImplementation({
    implementation: NotStartsWithOperatorImpl,
    dependencies: []
});
