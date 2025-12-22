// handler.ts
import { createFunction } from "../createFunction.js";
import { listUsersHandler } from "./ListUsersFunction.js";
import { ConsoleLogger, DynamoDbUserService } from "~/services";

// Handler automatically detects event type via qualifiers and executes the right handler!
export const handler = createFunction((container) => {
    // Register services
    container.register(ConsoleLogger).inSingletonScope();
    container.register(DynamoDbUserService).inSingletonScope();

    // Register the handler - event will be automatically qualified as API Gateway
    container.register(listUsersHandler).inSingletonScope();
});
