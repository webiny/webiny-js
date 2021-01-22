import { graphql } from "graphql";

const processRequestBody = async (body, schema, context) => {
    const { query, variables, operationName } = body;

    context.plugins.byType("handler-graphql-before-query").forEach(pl => pl.apply(context));

    const result = await graphql(schema, query, {}, context, variables, operationName);

    context.plugins.byType("handler-graphql-after-query").forEach(pl => {
        pl.apply(result, context);
    });

    return result;
};

export default async (requestBody, schema, context) => {
    let result;
    if (Array.isArray(requestBody)) {
        result = [];
        for (let i = 0; i < requestBody.length; i++) {
            result.push(await processRequestBody(requestBody[i], schema, context));
        }
    } else {
        result = await processRequestBody(requestBody, schema, context);
    }

    return result;
};
