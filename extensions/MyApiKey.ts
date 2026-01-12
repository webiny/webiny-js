import { ApiKeyFactory } from "webiny/api/security";

class MyApiKeyImpl implements ApiKeyFactory.Interface {
    execute(): ApiKeyFactory.Return {
        return [
            {
                name: "Universal API Key",
                token: "wat_12345678",
                permissions: [{ name: "*" }]
            }
        ];
    }
}

export const MyApiKey = ApiKeyFactory.createImplementation({
    implementation: MyApiKeyImpl,
    dependencies: []
});
