import { ApiKeyFactory, ApiToken } from "@webiny/api-core/exports/api/security.js";

class UniversalApiKeyFactory implements ApiKeyFactory.Interface {
    execute(): ApiKeyFactory.Return {
        const token = process.env["WEBINY_API_UNIVERSAL_API_TOKEN"];

        if (!token) {
            return [];
        }

        return [
            {
                name: "Universal API Key",
                slug: "universal-key",
                token: ApiToken.validate(token),
                permissions: [{ name: "wb.*" }, { name: "cms.*" }]
            }
        ];
    }
}

export default ApiKeyFactory.createImplementation({
    implementation: UniversalApiKeyFactory,
    dependencies: []
});
