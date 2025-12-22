// handler.ts
import { createFunction } from "../createFunction.js";
import { listUsersFunction } from "./ListUsersFunction.js";
import { ConsoleLogger, DynamoDbUserService } from "~/services";

// Handler automatically detects event type and executes the right function!
export const handler = createFunction((container) => {
    // Register services
    container.register(ConsoleLogger).inSingletonScope();
    container.register(DynamoDbUserService).inSingletonScope();

    // Register the function implementation
    // The handler will auto-detect this is an API Gateway function based on the event
    container.register(listUsersFunction).inSingletonScope();
});
