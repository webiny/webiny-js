import { createImplementation } from "@webiny/di";
import { MainGraphQLClient } from "./abstractions.js";
import { GraphQLClient } from "~/features/graphqlClient/abstractions.js";
import { EnvConfig } from "~/features/envConfig/index.js";

class MainGraphQLClientImpl implements MainGraphQLClient.Interface {
    private readonly endpoint: string;

    constructor(
        envConfig: EnvConfig.Interface,
        private client: GraphQLClient.Interface
    ) {
        this.endpoint = envConfig.get("graphqlApiUrl");
    }

    async execute<TResult = any, TVariables = any>(
        params: MainGraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        return this.client.execute({ endpoint: this.endpoint, ...params });
    }
}

export const DefaultMainGraphQLClient = createImplementation({
    abstraction: MainGraphQLClient,
    implementation: MainGraphQLClientImpl,
    dependencies: [EnvConfig, GraphQLClient]
});
