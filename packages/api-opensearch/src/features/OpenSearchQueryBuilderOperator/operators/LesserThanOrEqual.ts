import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class LesserThanOrEqualImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "lte";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        query.filter.push({
            range: {
                [basePath]: {
                    lte: value
                }
            }
        });
    }
}

export const LesserThanOrEqual = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: LesserThanOrEqualImpl,
    dependencies: []
});
