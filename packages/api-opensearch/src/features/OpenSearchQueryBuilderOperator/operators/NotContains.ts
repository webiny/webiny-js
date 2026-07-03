import { normalizeValueWithAsterisk } from "~/normalize.js";
import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class NotContainsImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "not_contains";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        query.must_not.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [basePath],
                query: normalizeValueWithAsterisk(value),
                default_operator: "and"
            }
        });
    }
}

export const NotContains = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: NotContainsImpl,
    dependencies: []
});
