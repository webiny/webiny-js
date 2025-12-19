// handler.ts
import { createFunction, ApiGatewayFunction } from "@cloudi/aws";
import { ListUsersFunction } from "~/features/ListUsersFunction";
import { ConsoleLogger, DynamoDbUserService } from "~/services";

export const handler = createFunction(
    ApiGatewayFunction,
    async (container) => {
        // Register services
        container.register(ConsoleLogger).inSingletonScope();
        container.register(DynamoDbUserService).inSingletonScope();

        // Register the function implementation
        container.register(ListUsersFunction).inSingletonScope();
    }
);