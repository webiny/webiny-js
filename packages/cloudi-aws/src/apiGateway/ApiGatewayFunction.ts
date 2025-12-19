import type {
    APIGatewayEvent,
    APIGatewayProxyResult,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import { createApiGatewayHandler } from "@webiny/handler-aws";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

/**
 * Abstract class for API Gateway Lambda functions with DI support
 */
export abstract class ApiGatewayFunction extends CloudFunction<
    APIGatewayEvent,
    APIGatewayProxyResult
> {
    /**
     * Handle the API Gateway event
     */
    abstract execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult>;

    /**
     * Helper method to create a successful response
     */
    protected success(body: any, statusCode: number = 200): APIGatewayProxyResult {
        return {
            statusCode,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        };
    }

    /**
     * Helper method to create an error response
     */
    protected error(message: string, statusCode: number = 500): APIGatewayProxyResult {
        return {
            statusCode,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: message })
        };
    }
}

/**
 * Factory function to create API Gateway handlers with DI
 */
export function createApiGatewayFunction<T extends ApiGatewayFunction>(
    FunctionClass: new (container: Container) => T,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: T | null = null;

    return async (
        event: APIGatewayEvent,
        context: LambdaContext
    ): Promise<APIGatewayProxyResult> => {
        // Initialize on cold start
        if (!functionInstance) {
            const container = new Container();

            // Run user setup
            if (setup) {
                await setup(container);
            }

            // Create function instance
            functionInstance = new FunctionClass(container);
        }

        // Handle the event
        return functionInstance.handle(event);
    };
}

export type { APIGatewayEvent, APIGatewayProxyResult };

