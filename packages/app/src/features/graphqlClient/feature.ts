import { GraphQLClient } from "./abstractions.js";
import { BatchingGraphQLClient } from "./BatchingGraphQLClient.js";
import { FetchGraphQLClient } from "./FetchGraphQLClient.js";
import { createFeature } from "~/shared/di/createFeature.js";
import { RetryGraphQLClient } from "./RetryGraphQLClient.js";

export const GraphQLClientFeature = createFeature({
    name: "GraphQLClient",
    register(
        container,
        options: {
            batching: boolean;
            retry: boolean;
        }
    ) {
        // Base implementation
        container.register(FetchGraphQLClient).inSingletonScope();

        // Optional decorators (order matters: retry wraps batching)
        if (options.batching) {
            container.registerDecorator(BatchingGraphQLClient);
        }

        if (options.retry) {
            container.registerDecorator(RetryGraphQLClient);
        }
    },
    resolve(container) {
        return {
            client: container.resolve(GraphQLClient)
        };
    }
});
