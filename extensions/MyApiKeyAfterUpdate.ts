import { ApiKeyAfterUpdateHandler } from "webiny/api/security/features/UpdateApiKey";
import { LoggerService } from "webiny/api/security/features/Logger";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateHandler.Interface {
    constructor(private logger: LoggerService.Interface) {}

    async handle() {
        logger.info("An API key was updated!");
        console.log("An API key was updated!");
    }
}

export const MyApiKeyAfterUpdate = ApiKeyAfterUpdateHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: [LoggerService]
});
