import type { ExecutionResult, GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { GraphQLRequestBody } from "~/types.js";
import type { Context } from "@webiny/api/types.js";

const executeGraphQl = async <TData = Record<string, any>, TExtensions = Record<string, any>>(
    body: GraphQLRequestBody,
    schema: GraphQLSchema,
    context: Context
): Promise<ExecutionResult<TData, TExtensions>> => {
    const { query, variables, operationName } = body;
    return graphql({
        schema,
        source: query,
        rootValue: {},
        contextValue: context,
        variableValues: variables,
        operationName
    }) as Promise<ExecutionResult<TData, TExtensions>>;
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
            const result = await executeGraphQl<TData, TExtensions>(body, schema, context);
            results.push(result);
        }
        return results;
    }
    return await executeGraphQl<TData, TExtensions>(requestBody, schema, context);
};
