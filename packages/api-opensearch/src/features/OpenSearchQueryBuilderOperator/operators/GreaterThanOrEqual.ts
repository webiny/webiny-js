import type { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

export class GreaterThanOrEqual implements OpenSearchQueryBuilderOperator.Interface {
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
