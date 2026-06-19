import type { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

export class LesserThan implements OpenSearchQueryBuilderOperator.Interface {
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
