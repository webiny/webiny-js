import { createImplementation } from "@webiny/di";
import { GraphQLClient } from "./abstractions.js";
import { RequestValue } from "~/features/graphqlClient/RequestValue.js";

class GraphQLClientImpl implements GraphQLClient.Interface {
    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const request = RequestValue.from(params);

        const body = JSON.stringify({
            query: request.queryAsString,
            variables: request.variables,
            operationName: request.operationName
        });

        return this.fetch<TResult>(request.endpoint, body, request.headers);
    }

    private async fetch<TResult = any>(
        endpoint: string,
        body: string,
        headers: GraphQLClient.Headers = {}
    ): Promise<TResult> {
        let response: Response;
        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(headers || {})
                },
                body
            });
        } catch (err) {
            throw new Error(`Network error: ${(err as Error).message}`);
        }
        let json: any;
        try {
            json = await response.json();
        } catch {
            throw new Error("Failed to parse GraphQL response as JSON.");
        }

        // Check for generic API errors
        if (response.status !== 200) {
            throw { message: json.message, code: json.code };
        }

        // Check for GraphQL errors
        if (json.errors && json.errors.length > 0) {
            throw new Error(`GraphQL errors`, { cause: json.errors });
        }
        return json.data as TResult;
    }
}

export const FetchGraphQLClient = createImplementation({
    abstraction: GraphQLClient,
    implementation: GraphQLClientImpl,
    dependencies: []
});
