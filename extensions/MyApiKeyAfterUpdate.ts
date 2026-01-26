import { ApiKeyAfterUpdateHandler } from "webiny/api/security/features/UpdateApiKey";

import { Logger } from "webiny/api/logger";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateHandler.Interface {
    constructor(private logger: Logger.Interface) {}

    async handle() {
        this.logger.warn("An API key was updated!");
    }
}

const MyApiKeyAfterUpdate = ApiKeyAfterUpdateHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: [Logger]
});

export default MyApiKeyAfterUpdate;
