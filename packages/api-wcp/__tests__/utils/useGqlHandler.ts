import { createHandler } from "@webiny/handler-aws";
import { GET_PROJECT_QUERY } from "./graphql/project";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import graphqlHandler from "@webiny/handler-graphql";

export interface InvokeParams {
    httpMethod?: "POST" | "GET" | "OPTIONS";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGqlHandler = () => {
    const handler = createHandler({
        plugins: [graphqlHandler(), createWcpContext(), createWcpGraphQL()],
        http: { debug: true }
    });

    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });
        if (httpMethod === "OPTIONS" && !response.body) {
            return [null, response];
        }
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        async getProject(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PROJECT_QUERY, variables } });
        }
    };
};
