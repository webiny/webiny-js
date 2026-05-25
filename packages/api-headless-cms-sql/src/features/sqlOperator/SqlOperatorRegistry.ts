import WebinyError from "@webiny/error";
import {
    SqlOperatorRegistry as SqlOperatorRegistryAbstraction,
    SqlOperator
} from "./abstractions/index.js";

class SqlOperatorRegistryImpl implements SqlOperatorRegistryAbstraction.Interface {
    private readonly operators: Map<string, SqlOperator.Interface>;

    public constructor(operators: SqlOperator.Interface[]) {
        this.operators = new Map(operators.map(op => [op.operator, op]));
    }

    public get(operator: string): SqlOperator.Interface {
        const op = this.operators.get(operator);

        if (!op) {
            throw new WebinyError(
                `SQL operator "${operator}" is not registered.`,
                "SQL_OPERATOR_NOT_FOUND",
                { operator }
            );
        }

        return op;
    }
}

export const SqlOperatorRegistry = SqlOperatorRegistryAbstraction.createImplementation({
    implementation: SqlOperatorRegistryImpl,
    dependencies: [[SqlOperator, { multiple: true }]]
});
