import { ApiKeyAfterUpdateHandler } from "webiny/api/security/features/UpdateApiKey";

// TODO: conclude this is the import path we want to use
import { LoggerService } from "webiny/api/features/Logger";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateHandler.Interface {
    constructor(private logger: LoggerService.Interface) {}

    async handle() {
        this.logger.warn("An API key was updated!");
    }
}

export const MyApiKeyAfterUpdate = ApiKeyAfterUpdateHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: [LoggerService]
});
