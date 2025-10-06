import { GraphQLClient } from "./abstractions";
import { BatchingGraphQLClient } from "./BatchingGraphQLClient";
import { FetchGraphQLClient } from "./FetchGraphQLClient";
import { createFeature } from "~/shared/di/createFeature";
import { RetryGraphQLClient } from "./RetryGraphQLClient";

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
