import { OpenSearchQueryBuilderOperator } from "../abstractions/OpenSearchQueryBuilderOperator.js";

class InImpl implements OpenSearchQueryBuilderOperator.Interface {
    public getOperator(): string {
        return "in";
    }

    public apply(
        query: OpenSearchQueryBuilderOperator.Query,
        params: OpenSearchQueryBuilderOperator.Params
    ): void {
        const { value: values, path, basePath, name } = params;
        const isArray = Array.isArray(values);
        if (isArray === false || values.length === 0) {
            throw new Error(
                `You cannot filter field "${name}" with "in" operator and not send an array of values.`
            );
        }

        const useBasePath = values.some(
            (value: string | number | boolean | null | undefined) => typeof value !== "string"
        );

        query.filter.push({
            terms: {
                [useBasePath ? basePath : path]: values
            }
        });
    }
}

export const In = OpenSearchQueryBuilderOperator.createImplementation({
    implementation: InImpl,
    dependencies: []
});
