import { createImplementation } from "@webiny/di-container";
import { GraphQLClient } from "./abstractions.js";
import { EnvConfig } from "~/features/envConfig/index.js";

class GraphQLClientImpl implements GraphQLClient.Interface {
    private readonly graphqlApiUrl: string;

    constructor(envConfig: EnvConfig.Interface) {
        this.graphqlApiUrl = envConfig.get("graphqlApiUrl");
    }

    async execute<TVariables = any, TResult = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const { query, mutation, variables, headers = {} } = params;

        const body = query
            ? JSON.stringify({ query, variables })
            : JSON.stringify({ mutation, variables });

        return this.fetch<TResult>(body, headers);
    }

    private async fetch<TResult = any>(body: string, headers: Record<string, any>) {
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
        if (json.errors && json.errors.length > 0) {
            throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
        }
        return json.data as TResult;
    }
}

export const FetchGraphQLClient = createImplementation({
    abstraction: GraphQLClient,
    implementation: GraphQLClientImpl,
    dependencies: [EnvConfig]
});
