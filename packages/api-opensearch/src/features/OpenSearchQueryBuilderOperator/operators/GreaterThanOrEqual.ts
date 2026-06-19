import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class GreaterThanOrEqualImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "gte";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        query.filter.push({
            range: {
                [basePath]: {
                    gte: value
                }
            }
        });
    }
}

export const GreaterThanOrEqual = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: GreaterThanOrEqualImpl,
    dependencies: []
});
