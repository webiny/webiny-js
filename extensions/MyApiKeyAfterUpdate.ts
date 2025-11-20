import { ApiKeyAfterUpdateHandler } from "webiny/api/security/features/Event";

class MyApiKeyAfterUpdateImpl implements ApiKeyAfterUpdateHandler.Interface {
    async handle() {
        console.log("An API key was updated!");
    }
}

export const MyApiKeyAfterUpdate = ApiKeyAfterUpdateHandler.createImplementation({
    implementation: MyApiKeyAfterUpdateImpl,
    dependencies: []
});
