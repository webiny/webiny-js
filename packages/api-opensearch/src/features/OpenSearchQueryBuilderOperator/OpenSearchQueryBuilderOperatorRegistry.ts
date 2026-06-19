import type { OpenSearchQueryBuilderOperator } from "./abstractions/OpenSearchQueryBuilderOperator.js";
import type { OpenSearchQueryBuilderOperatorRegistry as Abstraction } from "./abstractions/OpenSearchQueryBuilderOperatorRegistry.js";

export class OpenSearchQueryBuilderOperatorRegistryImpl implements Abstraction.Interface {
    private readonly operators: Map<string, OpenSearchQueryBuilderOperator.Interface>;

    public constructor(operators: OpenSearchQueryBuilderOperator.Interface[]) {
        this.operators = new Map();
        for (const operator of operators) {
            this.operators.set(operator.getOperator(), operator);
        }
    }

    public get(operator: string): OpenSearchQueryBuilderOperator.Interface | undefined {
        return this.operators.get(operator);
    }

    public getAll(): OpenSearchQueryBuilderOperator.Interface[] {
        return Array.from(this.operators.values());
    }
}
