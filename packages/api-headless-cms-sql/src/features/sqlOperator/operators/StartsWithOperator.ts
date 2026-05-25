import { SqlOperator as SqlOperatorAbstraction } from "../abstractions/index.js";

class StartsWithOperatorImpl implements SqlOperatorAbstraction.Interface {
    public readonly operator = "startsWith";

    public apply(params: SqlOperatorAbstraction.ApplyParams): void {
        const { query, column, value } = params;

        if (typeof value !== "string") {
            return;
        }

        query.whereRaw("LOWER(??) LIKE LOWER(?)", [column, `${value}%`]);
    }
}

export const StartsWithOperator = SqlOperatorAbstraction.createImplementation({
    implementation: StartsWithOperatorImpl,
    dependencies: []
});
