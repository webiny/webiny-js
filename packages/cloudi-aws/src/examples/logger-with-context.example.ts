/**
 * Example: Using AwsLambdaContext in a Logger Implementation
 *
 * This example demonstrates how to use AwsLambdaContext as a dependency
 * in your implementations. Perfect for loggers like pino-lambda that need
 * access to the Lambda context.
 */

import { createImplementation, Abstraction } from "@webiny/di";
import { createFunction, Container } from "../index.js";
import { ApiGatewayEventHandler, AwsLambdaContext } from "../abstractions/index.js";
import type {
    APIGatewayEvent,
    APIGatewayProxyResult,
    Context
} from "@webiny/aws-sdk/types/index.js";

/**
 * Logger abstraction
 */
interface ILogger {
    info(message: string, data?: Record<string, any>): void;
    error(message: string, error?: Error): void;
}

const Logger = new Abstraction<ILogger>("Logger");

/**
 * Logger implementation that uses Lambda Context
 * This is similar to how you'd integrate pino-lambda
 */
class ContextAwareLogger implements ILogger {
    constructor(private context: Context) {}

    info(message: string, data?: Record<string, any>): void {
        console.log(
            JSON.stringify({
                level: "info",
                message,
                requestId: this.context.awsRequestId,
                functionName: this.context.functionName,
                ...data
            })
        );
    }

    error(message: string, error?: Error): void {
        console.error(
            JSON.stringify({
                level: "error",
                message,
                requestId: this.context.awsRequestId,
                functionName: this.context.functionName,
                error: error?.message,
                stack: error?.stack
            })
        );
    }
}

/**
 * Create logger implementation that depends on AwsLambdaContext
 */
export const contextAwareLogger = createImplementation({
    abstraction: Logger,
    implementation: ContextAwareLogger,
    dependencies: [AwsLambdaContext]
});

/**
 * API Gateway handler that uses the logger
 */
class MyApiHandler implements ApiGatewayEventHandler.Interface {
    constructor(private logger: ILogger) {}

    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
        this.logger.info("Processing API Gateway request", {
            path: event.path,
            method: event.httpMethod
        });

        try {
            // Your business logic here
            const result = {
                message: "Hello from Lambda!",
                timestamp: new Date().toISOString()
            };

            this.logger.info("Request processed successfully");

            return {
                statusCode: 200,
                body: JSON.stringify(result)
            };
        } catch (error) {
            this.logger.error("Request failed", error as Error);
            throw error;
        }
    }
}

export const myApiHandler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: MyApiHandler,
    dependencies: [Logger]
});

/**
 * Lambda handler setup
 */
export const handler = createFunction(async (container: Container) => {
    // Register logger - it will receive the Lambda context per invocation
    container.register(contextAwareLogger);

    // Register API Gateway handler
    container.register(myApiHandler);
});

/**
 * Key Points:
 *
 * 1. AwsLambdaContext is automatically registered per Lambda invocation
 * 2. You can inject it into any service that needs it (e.g., loggers)
 * 3. The context is fresh for each invocation
 * 4. Perfect for integrating with libraries like pino-lambda that need context
 *
 * Example with pino-lambda:
 *
 * ```typescript
 * import pino from "pino";
 * import { pinoLambdaDestination } from "pino-lambda";
 * import { createImplementation } from "@webiny/di";
 * import { AwsLambdaContext } from "@cloudi/aws";
 *
 * class PinoLogger implements ILogger {
 *     private logger: pino.Logger;
 *     private destination: any;
 *
 *     constructor(context: Context) {
 *         this.destination = pinoLambdaDestination();
 *         this.logger = pino({}, this.destination);
 *         this.destination.setContext(context);
 *     }
 *
 *     info(message: string, data?: Record<string, any>): void {
 *         this.logger.info(data || {}, message);
 *     }
 *
 *     error(message: string, error?: Error): void {
 *         this.logger.error({ err: error }, message);
 *     }
 * }
 *
 * export const pinoLogger = createImplementation({
 *     abstraction: Logger,
 *     implementation: PinoLogger,
 *     dependencies: [AwsLambdaContext]
 * });
 * ```
 */
