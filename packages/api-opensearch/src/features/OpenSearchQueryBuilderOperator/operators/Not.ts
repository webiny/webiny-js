import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class NotImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "not";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, path, basePath } = params;

        if (value === null || value === undefined) {
            query.filter.push({
                exists: {
                    field: path
                }
            });
            return;
        }

        const typeOf = typeof value;

        if (typeOf === "boolean") {
            query.filter.push({
                bool: {
                    must_not: {
                        term: {
                            [path]: value
                        }
                    }
                }
            });
            return;
        }

        const useBasePath = typeOf !== "string";
        const valuePath = useBasePath ? basePath : path;
        query.must_not.push({
            term: {
                [valuePath]: value
            }
        });
    }
}

export const Not = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: NotImpl,
    dependencies: []
});
