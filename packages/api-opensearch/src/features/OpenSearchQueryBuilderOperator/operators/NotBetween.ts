import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class NotBetweenImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "not_between";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value, basePath, name } = params;
        if (Array.isArray(value) === false) {
            throw new Error(
                `You cannot filter field path "${name}" with "not_between" query and not send an array of values.`
            );
        } else if (value.length !== 2) {
            throw new Error(
                `You must pass 2 values in the array for field path "${name}" filtering.`
            );
        }
        const [gte, lte] = value;
        query.must_not.push({
            range: {
                [basePath]: {
                    lte,
                    gte
                }
            }
        });
    }
}

export const NotBetween = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: NotBetweenImpl,
    dependencies: []
});
