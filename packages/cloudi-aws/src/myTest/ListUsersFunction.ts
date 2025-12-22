// features/ListUsersFunction.ts
import { createImplementation } from "@webiny/di";
import {
    ApiGatewayFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type NextFunction
} from "../index.js";
import type { UserService } from "~/abstractions";
import type { LoggerService } from "~/abstractions";

export class ListUsersFunction implements ApiGatewayFunction.Interface {
    constructor(
        private userService: UserService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute(event: APIGatewayEvent, next: NextFunction): Promise<APIGatewayProxyResult> {
        // Middleware pattern: check if this handler can process the event
        if (!event.httpMethod) {
            return next();
        }

        this.logger.info("Listing users");

        try {
            const users = await this.userService.listUsers();

            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true, data: users })
            };
        } catch (error) {
            this.logger.error("Failed to list users", error);

            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: false, error: "Internal server error" })
            };
        }
    }
}

// Export using createImplementation from @webiny/di
export const listUsersFunction = createImplementation({
    abstraction: ApiGatewayFunction,
    implementation: ListUsersFunction,
    dependencies: [UserService, LoggerService]
});