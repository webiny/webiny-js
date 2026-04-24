import { BaseError } from "@webiny/feature/admin";
import { GraphQLClient } from "./abstractions.js";
import { EnvConfig } from "~/features/envConfig/index.js";

class RetryGraphQLClientImpl implements GraphQLClient.Interface {
    private readonly maxRetries: number;
    private readonly baseDelayMs: number;

    constructor(
        envConfig: EnvConfig.Interface,
        private decoratee: GraphQLClient.Interface
    ) {
        const gqlClientConfig = envConfig.get("graphqlClient");

        this.maxRetries = gqlClientConfig?.retries.maxRetries ?? 3;
        this.baseDelayMs = gqlClientConfig?.retries.delayInMillis ?? 100;
    }

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.decoratee.execute(params);
            } catch (error) {
                lastError = error as Error;

                // Don't retry GraphQL errors (business logic errors)
                // Only retry network/infrastructure errors
                if (
                    this.isGraphQLError(error as Error) ||
                    this.isAuthenticationError(error as BaseError) ||
                    this.isMaintenanceError(error as BaseError)
                ) {
                    throw error;
                }

                // Don't delay after the last attempt
                if (attempt < this.maxRetries) {
                    await this.delay(this.calculateBackoff(attempt));
                }
            }
        }

        throw lastError!;
    }

    private isGraphQLError(error: Error): boolean {
        return error.message.includes("GraphQL");
    }

    private isAuthenticationError(error: BaseError): boolean {
        return error.code?.includes("Authentication/");
    }

    private isMaintenanceError(error: BaseError): boolean {
        return error.code?.includes("Tenancy/");
    }

    private calculateBackoff(attempt: number): number {
        // Exponential backoff: 100ms, 200ms, 400ms, etc.
        return Math.pow(2, attempt) * this.baseDelayMs;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const RetryGraphQLClient = GraphQLClient.createDecorator({
    decorator: RetryGraphQLClientImpl,
    dependencies: [EnvConfig]
});
