import { GraphQLClient } from "./abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { NetworkErrorEvent } from "~/errors/index.js";
import { RequestValue } from "./RequestValue.js";

class NetworkErrorPublishingDecorator implements GraphQLClient.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        try {
            return await this.decoratee.execute(params);
        } catch (error) {
            // Only publish network errors, not GraphQL errors
            if (this.isNetworkError(error as Error)) {
                const request = RequestValue.from(params);

                const event = new NetworkErrorEvent({
                    message: (error as Error).message,
                    operationName: request.operationName,
                    query: request.queryAsString,
                    variables: request.variables,
                    errorType: this.determineErrorType(error as Error)
                });

                await this.eventPublisher.publish(event);
            }

            // Re-throw to preserve existing behavior
            throw error;
        }
    }

    private isNetworkError(error: Error): boolean {
        // Network errors typically have these patterns in the message
        return (
            error.message.includes("Network error") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("network failure") ||
            error.message.includes("Local AWS Lambda")
        );
    }

    private determineErrorType(error: Error): "network" | "timeout" | "fetch" | "unknown" {
        const message = error.message.toLowerCase();

        if (message.includes("timeout")) {
            return "timeout";
        }

        if (message.includes("fetch") || message.includes("failed to fetch")) {
            return "fetch";
        }

        if (message.includes("network")) {
            return "network";
        }

        return "unknown";
    }
}

export const NetworkErrorPublishing = GraphQLClient.createDecorator({
    decorator: NetworkErrorPublishingDecorator,
    dependencies: [EventPublisher]
});
