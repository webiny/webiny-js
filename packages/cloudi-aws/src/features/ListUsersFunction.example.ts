/**
 * Example: List Users API Gateway Handler
 */

import { Abstraction } from "@webiny/di";
import {
    ApiGatewayEventHandler,
    type APIGatewayEvent,
    type APIGatewayProxyResult
} from "../index.js";
import type { NextFunction } from "../types.js";

interface IUserService {
    listUsers(): Promise<Array<{ id: string; name: string; email: string }>>;
}

interface ILoggerService {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

declare const UserService: Abstraction<IUserService>;
declare const LoggerService: Abstraction<ILoggerService>;

class ListUsersHandler implements ApiGatewayEventHandler.Interface {
    constructor(
        private userService: IUserService,
        private logger: ILoggerService
    ) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        if (event.httpMethod !== "GET" || !event.path.startsWith("/users")) {
            return next();
        }

        this.logger.info("Handling list users request", { path: event.path });

        try {
            const users = await this.userService.listUsers();
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: users })
            };
        } catch (error) {
            this.logger.error("Failed to list users", error);
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Failed to retrieve users" })
            };
        }
    }
}

export const listUsersHandler = ApiGatewayEventHandler.createImplementation({
    implementation: ListUsersHandler,
    dependencies: [UserService, LoggerService]
});

/**
 * Usage:
 *
 * export const handler = createEventHandler(async (container) => {
 *   container.register(consoleLogger).inSingletonScope();
 *   container.register(dynamoDbUserService).inSingletonScope();
 *   container.register(listUsersHandler).inSingletonScope();
 * });
 */
