import type { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

export class LesserThanOrEqual implements OpenSearchQueryBuilderOperator.Interface {
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
