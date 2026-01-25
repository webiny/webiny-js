import { BaseError } from "@webiny/feature/admin";
import { GraphQLClient } from "./abstractions.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { AuthenticationErrorEvent } from "~/errors/index.js";

class AuthenticationErrorPublishingDecorator implements GraphQLClient.Interface {
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
            // Only publish authentication errors
            if (this.isAuthenticationError(error as BaseError)) {
                const event = new AuthenticationErrorEvent({
                    message: (error as Error).message,
                    code: (error as BaseError).code
                });

                await this.eventPublisher.publish(event);
            }

            // Re-throw to preserve existing behavior
            throw error;
        }
    }

    private isAuthenticationError(error: BaseError): boolean {
        return error.code?.startsWith("Authentication/") ?? false;
    }
}

export const AuthenticationErrorPublishing = GraphQLClient.createDecorator({
    decorator: AuthenticationErrorPublishingDecorator,
    dependencies: [EventPublisher]
});
