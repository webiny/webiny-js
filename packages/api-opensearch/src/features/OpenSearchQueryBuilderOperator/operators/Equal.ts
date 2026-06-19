import type { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

export class Equal implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "eq";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, path, basePath } = params;

        if (value === null || value === undefined) {
            query.must_not.push({
                exists: {
                    field: path
                }
            });
            return;
        }
        const typeOf = typeof value;
        if (typeOf === "number" || typeOf === "boolean") {
            query.filter.push({
                term: {
                    [basePath]: value
                }
            });
            return;
        }
        const useBasePath = typeOf !== "string";
        const valuePath = useBasePath ? basePath : path;
        query.filter.push({
            term: {
                [valuePath]: value
            }
        });
    }
}
