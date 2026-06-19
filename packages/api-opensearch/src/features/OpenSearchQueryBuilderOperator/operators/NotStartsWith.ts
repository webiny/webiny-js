import type { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

export class NotStartsWith implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "not_startsWith";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        if (value === "" || value === null || value === undefined) {
            return;
        }
        query.must_not.push({
            match_phrase_prefix: {
                [basePath]: value
            }
        });
    }
}
