// features/ListUsersFunction.ts
import { createImplementation } from "@webiny/di";
import {
    ApiGatewayEventHandler,
    type APIGatewayEvent,
    type APIGatewayProxyResult
} from "../index.js";
import type { UserService } from "~/abstractions";
import type { LoggerService } from "~/abstractions";

export class ListUsersHandler implements ApiGatewayEventHandler.Interface {
    constructor(
        private userService: UserService.Interface,
        private logger: LoggerService.Interface
    ) {}

    async execute(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
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
export const listUsersHandler = createImplementation({
    abstraction: ApiGatewayEventHandler,
    implementation: ListUsersHandler,
    dependencies: [UserService, LoggerService]
});