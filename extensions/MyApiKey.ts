import { ApiKeyFactory } from "webiny/api/security";

class MyApiKeyImpl implements ApiKeyFactory.Interface {
    async execute(): ApiKeyFactory.Return {
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

export default ApiKeyFactory.createImplementation({
    implementation: MyApiKeyImpl,
    dependencies: []
});
