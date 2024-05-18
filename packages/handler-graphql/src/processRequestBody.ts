import { ExecutionResult, graphql, GraphQLSchema } from "graphql";
import { GraphQLAfterQueryPlugin, GraphQLBeforeQueryPlugin, GraphQLRequestBody } from "~/types";
import { Context } from "@webiny/api/types";

const executeGraphQl = async (
    body: GraphQLRequestBody,
    schema: GraphQLSchema,
    context: Context
) => {
    const { query, variables, operationName } = body;

    context.plugins
        .byType<GraphQLBeforeQueryPlugin>("graphql-before-query")
        .forEach(pl => pl.apply({ body, schema, context }));

    const result = await graphql(schema, query, {}, context, variables, operationName);

    context.plugins.byType<GraphQLAfterQueryPlugin>("graphql-after-query").forEach(pl => {
        pl.apply({ result, body, schema, context });
    });

    return result;
};

export const processRequestBody = async <
    TData = Record<string, any>,
    TExtensions = Record<string, any>
>(
    requestBody: GraphQLRequestBody | GraphQLRequestBody[],
    schema: GraphQLSchema,
    context: Context
): Promise<ExecutionResult<TData, TExtensions>[] | ExecutionResult<TData, TExtensions>> => {
    if (Array.isArray(requestBody)) {
        const results: ExecutionResult<TData, TExtensions>[] = [];
        for (const body of requestBody) {
            const result = await executeGraphQl(body, schema, context);
            results.push(result as ExecutionResult<TData, TExtensions>);
        }
        return results;
    }
    return (await executeGraphQl(requestBody, schema, context)) as ExecutionResult<
        TData,
        TExtensions
    >;
};
