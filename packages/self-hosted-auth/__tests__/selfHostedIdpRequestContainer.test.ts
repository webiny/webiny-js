import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { JwtIdentityProvider } from "@webiny/api-core/idp/index.js";
import { SelfHostedIdpFeature } from "~/api/features/SelfHostedIdp/index.js";
import { TokenIssuerFeature } from "~/api/domain/crypto/TokenIssuer.js";
import { SELF_HOSTED_ISSUER } from "~/api/domain/crypto/TokenIssuer.js";

/**
 * The standalone handler registers the identity provider in the root container, while
 * BuildParams (which holds the signing secret) is registered per request, in the child.
 */
describe("SelfHostedJwtIdentityProvider", () => {
    it("resolves with BuildParams registered only in the request container", () => {
        const root = new Container();
        TokenIssuerFeature.register(root);
        SelfHostedIdpFeature.register(root);

        const request = root.createChildContainer();
        request.registerInstance(BuildParams, {
            get: <T>(key: string) =>
                key === "SelfHostedAuthSigningSecret" ? ("test-signing-secret" as T) : null
        });

        const idp = request.resolve(JwtIdentityProvider);

        expect(idp.isApplicable({ iss: SELF_HOSTED_ISSUER })).toBe(true);
    });
});
