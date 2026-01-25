import { GraphQLClient } from "./abstractions.js";
import { BatchingGraphQLClient } from "./BatchingGraphQLClient.js";
import { FetchGraphQLClient } from "./FetchGraphQLClient.js";
import { createFeature } from "~/shared/di/createFeature.js";
import { RetryGraphQLClient } from "./RetryGraphQLClient.js";
import { NetworkErrorPublishing } from "./NetworkErrorPublishing.js";

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

        container.registerDecorator(NetworkErrorPublishing);
    },
    resolve(container) {
        return {
            client: container.resolve(GraphQLClient)
        };
    }
});
