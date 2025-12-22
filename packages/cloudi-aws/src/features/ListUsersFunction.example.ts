/**
 * Example: List Users API Gateway Function
 *
 * This example demonstrates how to create a Lambda function that:
 * - Implements the ApiGatewayFunction interface
 * - Uses dependency injection for services
 * - Uses middleware pattern with next() to handle event routing
 * - Exports using ApiGatewayFunction.createImplementation()
 * - Registers with container.register()
 */

import {
    ApiGatewayFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type NextFunction
} from "../index.js";

// Example service interfaces (you would define these in your abstractions)
interface IUserService {
    listUsers(): Promise<Array<{ id: string; name: string; email: string }>>;
}

interface ILoggerService {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

// Example abstraction declarations (you would define these in your abstractions)
declare const UserService: any;
declare const LoggerService: any;

/**
 * Implementation of the ListUsers function
 */
export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
    constructor(
        private userService: IUserService,
        private logger: ILoggerService
    ) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        // Middleware pattern: check if this handler can process the event
        // If not an API Gateway event, pass to the next handler
        if (!event.httpMethod) {
            return next();
        }

        this.logger.info("Handling list users request", {
            path: event.path,
            method: event.httpMethod
        });

        try {
            // Get users from the service
            const users = await this.userService.listUsers();

            // Return successful response
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    success: true,
                    data: users
                })
            };
        } catch (error) {
            this.logger.error("Failed to list users", error);

            // Return error response
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    success: false,
                    error: "Failed to retrieve users"
                })
            };
        }
    }
}

/**
 * Export the implementation using ApiGatewayFunction.createImplementation
 */
export const ListUsersFunction = ApiGatewayFunction.createImplementation({
    implementation: ListUsersFunctionImpl,
    dependencies: [UserService, LoggerService]
});

/**
 * Example usage in handler file:
 *
 * import { createFunction } from "@cloudi/aws";
 * import { ListUsersFunction } from "./features/ListUsersFunction.example";
 * import { ProcessOrderFunction } from "./features/ProcessOrderFunction.example";
 * import { ConsoleLogger, DynamoDbUserService, DynamoDbOrderService } from "./services";
 *
 * // Single handler that can handle multiple event types!
 * export const handler = createFunction((container) => {
 *   // Register services
 *   container.register(ConsoleLogger).inSingletonScope();
 *   container.register(DynamoDbUserService).inSingletonScope();
 *   container.register(DynamoDbOrderService).inSingletonScope();
 *
 *   // Register multiple function implementations
 *   // The middleware pattern will automatically route to the correct handler
 *   container.register(ListUsersFunction).inSingletonScope();      // Handles API Gateway events
 *   container.register(ProcessOrderFunction).inSingletonScope();   // Handles SNS events
 * });
 *
 * // Deploy this single Lambda function with multiple triggers:
 * // - API Gateway trigger for HTTP requests
 * // - SNS topic trigger for order processing
 * // The middleware chain automatically executes the right implementation!
 */

