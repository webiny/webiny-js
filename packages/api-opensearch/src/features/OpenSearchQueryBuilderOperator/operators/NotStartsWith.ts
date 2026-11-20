import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";
import { startsWithQuery } from "./startsWithQuery.js";

class NotStartsWithImpl implements OpenSearchQueryBuilderOperator.Interface {
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
        query.must_not.push(startsWithQuery(basePath, String(value)));
    }
}

export const NotStartsWith = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: NotStartsWithImpl,
    dependencies: []
});
