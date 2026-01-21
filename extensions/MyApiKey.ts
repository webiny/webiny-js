import { ApiKeyFactory } from "webiny/api/security";

class MyApiKeyImpl implements ApiKeyFactory.Interface {
    execute(): ApiKeyFactory.Return {
        return [
            {
                name: "Universal API Key",
                slug: "universal-key",
                token: "wat_12345678",
                permissions: [{ name: "*" }]
            }
        ];
    }
}

const MyApiKey = ApiKeyFactory.createImplementation({
    implementation: MyApiKeyImpl,
    dependencies: []
});

export default MyApiKey;
