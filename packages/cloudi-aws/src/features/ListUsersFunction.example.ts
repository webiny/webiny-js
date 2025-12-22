/**
 * Example: List Users API Gateway Handler
 *
 * This example demonstrates how to create a Lambda handler that:
 * - Implements the ApiGatewayEventHandler interface
 * - Uses dependency injection for services
 * - Exports using createImplementation from @webiny/di
 * - Registers with container.register()
 */

import { createImplementation } from "@webiny/di";
import {
    ApiGatewayEventHandler,
    type APIGatewayEvent,
    type APIGatewayProxyResult
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
 * Implementation of the ListUsers handler
 */
export class ListUsersHandler implements ApiGatewayEventHandler.Interface {
    constructor(
        private userService: IUserService,
        private logger: ILoggerService
    ) {}

    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
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
 * Export the implementation using createImplementation from @webiny/di
 */
export const listUsersHandler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: ListUsersHandler,
    dependencies: [UserService, LoggerService]
});

/**
 * Example usage in handler file:
 *
 * import { createFunction } from "@cloudi/aws";
 * import { listUsersHandler } from "./features/ListUsersFunction.example";
 * import { consoleLogger, dynamoDbUserService } from "./services";
 *
 * export const handler = createFunction((container) => {
 *   // Register services
 *   container.register(consoleLogger).inSingletonScope();
 *   container.register(dynamoDbUserService).inSingletonScope();
 *
 *   // Register handler - event will be automatically qualified as API Gateway
 *   container.register(listUsersHandler).inSingletonScope();
 * });
 */

