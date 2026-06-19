import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class AndInImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "and_in";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value: values, path, basePath } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${path}" with "in" operator and not send an array of values.`
            );
        }

        let useBasePath = false;
        for (const value of values) {
            if (typeof value !== "string") {
                useBasePath = true;
                break;
            }
        }

        for (const value of values) {
            query.filter.push({
                term: {
                    [useBasePath ? basePath : path]: value
                }
            });
        }
    }
}

export const AndIn = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: AndInImpl,
    dependencies: []
});
