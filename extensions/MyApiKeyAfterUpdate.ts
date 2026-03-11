import { ApiKeyAfterUpdateEventHandler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";
import { BuildParams } from "webiny/api/build-params";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateEventHandler.Interface {
    constructor(
        private logger: Logger.Interface,
        private buildParams: BuildParams.Interface
    ) {}

    async handle() {
        this.logger.debug("An API key was updated!");

        // Read build params
        const param1 = this.buildParams.get<string>("MY_CUSTOM_BUILD_PARAM");
        const param2 = this.buildParams.get<{ myKey: number; nested: { foo: string } }>(
            "MY_CUSTOM_BUILD_PARAM-2"
        );

        console.log("---- Build Params ----");

        console.log(`Build param 1: ${param1}`);
        console.log(`Build param 2:`, param2);
    }
}

const MyApiKeyAfterUpdate = ApiKeyAfterUpdateEventHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: [Logger, BuildParams]
});

export default MyApiKeyAfterUpdate;
