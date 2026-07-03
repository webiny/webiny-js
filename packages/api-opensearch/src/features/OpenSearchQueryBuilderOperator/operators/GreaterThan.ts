import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class GreaterThanImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "gt";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        query.filter.push({
            range: {
                [basePath]: {
                    gt: value
                }
            }
        });
    }
}

export const GreaterThan = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: GreaterThanImpl,
    dependencies: []
});
