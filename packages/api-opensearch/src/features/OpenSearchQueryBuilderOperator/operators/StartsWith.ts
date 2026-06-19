import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class StartsWithImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "startsWith";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        if (value === "" || value === null || value === undefined) {
            return;
        }
        query.filter.push({
            match_phrase_prefix: {
                [basePath]: value
            }
        });
    }
}

export const StartsWith = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: StartsWithImpl,
    dependencies: []
});
