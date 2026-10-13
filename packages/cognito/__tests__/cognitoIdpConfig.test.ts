import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { OidcIdentityProvider } from "@webiny/api-core/idp";
import { CognitoIdpFeature } from "~/api/features/CognitoIdp/feature.js";
import { CognitoIdpConfig } from "~/api/features/CognitoIdp/abstractions.js";

class ExtensionConfig implements CognitoIdpConfig.Interface {
    getIdentity() {
        return { id: "from-extension", displayName: "Extension User" };
    }
}

const ExtensionConfigImpl = CognitoIdpConfig.createImplementation({
    implementation: ExtensionConfig,
    dependencies: []
});

/**
 * The handlers register CognitoIdpFeature in the root container, and extensions (which provide
 * CognitoIdpConfig, e.g. Entra ID) register in the per-request child container. The provider must
 * see the request's config.
 */
describe("CognitoIdentityProvider", () => {
    it("uses the CognitoIdpConfig registered in the request container", async () => {
        const root = new Container();
        CognitoIdpFeature.register(root);

        const request = root.createChildContainer();
        request.register(ExtensionConfigImpl);

        const provider = request.resolve(OidcIdentityProvider);
        const token = { sub: "cognito-sub", email: "user@example.com" };
        const identity = await provider.getIdentity(token);

        expect(identity.id).toBe("from-extension");
        expect(identity.displayName).toBe("Extension User");
    });
});
