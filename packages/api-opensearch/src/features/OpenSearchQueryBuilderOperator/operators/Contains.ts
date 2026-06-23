import { normalizeValueWithAsterisk } from "~/normalize.js";
import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class ContainsImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "contains";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath } = params;
        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: [basePath],
                query: normalizeValueWithAsterisk(value),
                default_operator: "and"
            }
        });
    }
}

export const Contains = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: ContainsImpl,
    dependencies: []
});
