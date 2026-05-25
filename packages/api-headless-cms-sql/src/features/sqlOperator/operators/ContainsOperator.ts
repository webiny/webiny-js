import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class ContainsOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "contains";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string" || value.trim().length === 0) {
            return;
        }

        query.whereRaw("LOWER(??) LIKE LOWER(?)", [column, `%${value}%`]);
    }
}

export const ContainsOperator = SqlOperatorAbstraction.createImplementation({
    implementation: ContainsOperatorImpl,
    dependencies: []
});
