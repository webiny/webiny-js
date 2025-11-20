import { ApiKeyAfterUpdateHandler } from "webiny/api/security/features/UpdateApiKey";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateHandler.Interface {
    async handle() {
        console.log("An API key was created!");
    }
}

export const MyApiKeyAfterUpdate = ApiKeyAfterUpdateHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: []
});
