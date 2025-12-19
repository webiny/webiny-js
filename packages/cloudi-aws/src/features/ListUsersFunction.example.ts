/**
 * Example: List Users API Gateway Function
 *
 * This example demonstrates how to create a Lambda function that:
 * - Implements the ApiGatewayFunction interface
 * - Uses dependency injection for services
 * - Handles errors gracefully
 */

import type {
    APIGatewayEvent,
    APIGatewayProxyResult,
    IApiGatewayFunction
} from "../abstractions/index.js";

// Example service interfaces (you would define these in your abstractions)
interface IUserService {
    listUsers(): Promise<Array<{ id: string; name: string; email: string }>>;
}

interface ILoggerService {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

/**
 * Implementation of the ListUsers function
 */
export class ListUsersFunction implements IApiGatewayFunction {
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
 * Example usage in handler file:
 *
 * import { createFunction, ApiGatewayFunction } from "@cloudi/aws";
 * import { ListUsersFunction } from "./features/ListUsersFunction.example";
 * import { UserService, LoggerService } from "~/abstractions";
 * import { DynamoDBUserService } from "~/services/DynamoDBUserService";
 * import { ConsoleLogger } from "~/services/ConsoleLogger";
 *
 * export const handler = createFunction(
 *   ApiGatewayFunction,
 *   async (container) => {
 *     // Register services
 *     container.bind(LoggerService).to(ConsoleLogger);
 *     container.bind(UserService).to(DynamoDBUserService);
 *
 *     // Register the function implementation
 *     container.bind(ApiGatewayFunction).to(ListUsersFunction);
 *   }
 * );
 */

