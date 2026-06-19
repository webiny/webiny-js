import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class NotInImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "not_in";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value: values, path, basePath, name } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${name}" with "not_in" operator and not send an array of values.`
            );
        }

        const useBasePath = values.some(
            (value: string | number | boolean | null | undefined) => typeof value !== "string"
        );

        query.must_not.push({
            terms: {
                [useBasePath ? basePath : path]: values
            }
        });
    }
}

export const NotIn = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: NotInImpl,
    dependencies: []
});
