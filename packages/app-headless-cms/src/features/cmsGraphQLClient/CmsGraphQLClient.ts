import { GraphQLClient } from "@webiny/app/features/graphqlClient/abstractions.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { CmsGraphQLClient } from "./abstractions.js";

class CmsGraphQLClientImpl implements CmsGraphQLClient.Interface {
    private readonly endpoint: string;

    constructor(
        envConfig: EnvConfig.Interface,
        private client: GraphQLClient.Interface
    ) {
        this.endpoint = `${envConfig.get("apiUrl")}/cms/manage`;
    }

    async execute<TResult = any, TVariables = any>(
        params: CmsGraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        return this.client.execute({ endpoint: this.endpoint, ...params });
    }
}

export const DefaultCmsGraphQLClient = CmsGraphQLClient.createImplementation({
    implementation: CmsGraphQLClientImpl,
    dependencies: [EnvConfig, GraphQLClient]
});
