import { ApiGqlClient } from "@webiny/project-extensions-aws/abstractions/index.js";
import { createAwsOnlyError } from "./createAwsOnlyError.js";

class StandaloneApiGqlClient implements ApiGqlClient.Interface {
    async query(): Promise<never> {
        throw createAwsOnlyError("ApiGqlClient");
    }

    async mutation(): Promise<never> {
        throw createAwsOnlyError("ApiGqlClient");
    }
}

export const StandaloneApiGqlClientService = ApiGqlClient.createImplementation({
    implementation: StandaloneApiGqlClient,
    dependencies: []
});
