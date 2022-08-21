import { ExecutionResult, graphql, GraphQLSchema } from "graphql";
import { GraphQLAfterQueryPlugin, GraphQLBeforeQueryPlugin, GraphQLRequestBody } from "./types";
import { Context } from "@webiny/api/types";

const processRequestBody = async (
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

export default async (
    requestBody: GraphQLRequestBody | GraphQLRequestBody[],
    schema: GraphQLSchema,
    context: Context
): Promise<ExecutionResult[] | ExecutionResult> => {
    if (Array.isArray(requestBody) === true) {
        const result: ExecutionResult[] = [];
        for (let i = 0; i < (requestBody as GraphQLRequestBody[]).length; i++) {
            result.push(
                await processRequestBody((requestBody as GraphQLRequestBody[])[i], schema, context)
            );
        }
        return result;
    }
    return await processRequestBody(requestBody as GraphQLRequestBody, schema, context);
};
