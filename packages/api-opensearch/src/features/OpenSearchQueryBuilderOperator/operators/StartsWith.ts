import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";
import { startsWithQuery } from "./startsWithQuery.js";

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
        query.filter.push(startsWithQuery(basePath, String(value)));
    }
}

export const StartsWith = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: StartsWithImpl,
    dependencies: []
});
