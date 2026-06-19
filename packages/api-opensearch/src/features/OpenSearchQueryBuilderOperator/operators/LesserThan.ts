import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class LesserThanImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "lt";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        query.filter.push({
            range: {
                [basePath]: {
                    lt: value
                }
            }
        });
    }
}

export const LesserThan = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: LesserThanImpl,
    dependencies: []
});
