import { createImplementation } from "@webiny/di";
import { GraphQLClient } from "./abstractions.js";
import { EnvConfig } from "~/features/envConfig/index.js";
import { RequestValue } from "~/features/graphqlClient/RequestValue.js";

class GraphQLClientImpl implements GraphQLClient.Interface {
    private readonly graphqlApiUrl: string;

    constructor(envConfig: EnvConfig.Interface) {
        this.graphqlApiUrl = envConfig.get("graphqlApiUrl");
    }

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const request = RequestValue.from(params);

        const body = JSON.stringify({
            query: request.queryAsString,
            variables: request.variables,
            operationName: request.operationName
        });

        return this.fetch<TResult>(body, request.headers);
    }

    private async fetch<TResult = any>(
        body: string,
        headers: GraphQLClient.Headers = {}
    ): Promise<TResult> {
        let response: Response;
        try {
            response = await fetch(this.graphqlApiUrl, {
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
            throw new Error(`GraphQL error`, { cause: json.errors });
        }
        return json.data as TResult;
    }
}

export const FetchGraphQLClient = createImplementation({
    abstraction: GraphQLClient,
    implementation: GraphQLClientImpl,
    dependencies: [EnvConfig]
});
