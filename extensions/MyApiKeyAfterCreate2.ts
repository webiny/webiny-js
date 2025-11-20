import { ApiKeyAfterCreateHandler } from "webiny/api/security/features/CreateApiKey";

class MyApiKeyAfterCreateImpl implements ApiKeyAfterCreateHandler.Interface {
    async handle() {
        console.log("An API key was created!");
    }
}

export const MyApiKeyAfterCreate2 = ApiKeyAfterCreateHandler.createImplementation({
    implementation: MyApiKeyAfterCreateImpl,
    dependencies: []
});
