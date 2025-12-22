// features/ListUsersFunction.ts
import {
    ApiGatewayFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult,
    type NextFunction
} from "../index.js";
import type { UserService } from "~/abstractions";
import type { LoggerService } from "~/abstractions";

export class ListUsersFunctionImpl implements ApiGatewayFunction.Interface {
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

// Export using ApiGatewayFunction.createImplementation
export const ListUsersFunction = ApiGatewayFunction.createImplementation({
    implementation: ListUsersFunctionImpl,
    dependencies: [UserService, LoggerService]
});