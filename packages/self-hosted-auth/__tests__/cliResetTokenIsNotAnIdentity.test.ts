import { describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { JwtIdentityProvider } from "@webiny/api-core/idp/index.js";
import { SelfHostedIdpFeature } from "~/api/features/SelfHostedIdp/index.js";
import { TokenIssuerFeature, TokenIssuer } from "~/api/domain/crypto/TokenIssuer.js";
import { CLI_RESET_ISSUER, signCliResetToken } from "~/shared/cliResetToken.js";

/**
 * The CLI reset token and login tokens are signed with the same secret, so the only thing
 * stopping a reset token from being accepted as a login is the issuer check. These tests pin
 * that down from the identity side: a reset token must buy no identity at all.
 */

const SECRET = "test-signing-secret";
const EMAIL = "admin@example.com";

const createContainer = () => {
    const container = new Container();

    container.registerInstance(BuildParams, {
        get: <T>(key: string) => (key === "SelfHostedAuthSigningSecret" ? (SECRET as T) : null)
    });

    TokenIssuerFeature.register(container);
    SelfHostedIdpFeature.register(container);

    return container;
};

describe("a CLI reset token is not an identity", () => {
    it("is not applicable to the self-hosted identity provider", () => {
        const idp = createContainer().resolve(JwtIdentityProvider);

        expect(idp.isApplicable({ iss: CLI_RESET_ISSUER })).toBe(false);
    });

    it("buys no identity, even though it is signed with the login secret", async () => {
        const container = createContainer();
        const idp = container.resolve(JwtIdentityProvider);

        const token = signCliResetToken({ secret: SECRET, email: EMAIL });

        expect(await idp.getIdentity(token, {} as never)).toBeNull();
    });

    it("still accepts a real login token, so the guard is not over-broad", async () => {
        const container = createContainer();
        const idp = container.resolve(JwtIdentityProvider);
        const tokenIssuer = container.resolve(TokenIssuer);

        const { token } = await tokenIssuer.issue({ userId: "user-123", email: EMAIL });

        expect(idp.isApplicable({ iss: "webiny-self-hosted" })).toBe(true);

        const identity = await idp.getIdentity(token, {} as never);

        expect(identity?.id).toBe("user-123");
    });
});
