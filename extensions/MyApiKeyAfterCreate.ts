import { ApiKeyAfterCreateHandler } from "webiny/api/security/features/CreateApiKey.js";

class MyApiKeyAfterCreateImpl implements ApiKeyAfterCreateHandler.Interface {
    async handle() {
        console.log("An API key was created!");
    }
}

export const MyApiKeyAfterCreate = ApiKeyAfterCreateHandler.createImplementation({
    implementation: MyApiKeyAfterCreateImpl,
    dependencies: []
});
