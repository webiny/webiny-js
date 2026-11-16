import { describe, it, expect } from "vitest";
import { AnonymousIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { File } from "~/domain/file/types.js";
import { PrivateAuthenticatedAuthorizer } from "~/features/assetDelivery/privateFiles/PrivateAuthenticatedAuthorizer.js";

const createAuthorizer = (identity: AnonymousIdentity | AuthenticatedIdentity) => {
    const identityContext = { getIdentity: () => identity } as IdentityContext.Interface;
    return new PrivateAuthenticatedAuthorizer(identityContext);
};

const privateFile = { accessControl: { type: "private-authenticated" } } as File;
const publicFile = { accessControl: { type: "public" } } as File;

const admin = new AuthenticatedIdentity({ id: "admin", displayName: "Admin", type: "admin" });

describe("PrivateAuthenticatedAuthorizer", () => {
    it("refuses a private file to a request without a token", async () => {
        const anonymous = new AnonymousIdentity();
        const authorizer = createAuthorizer(anonymous);
        const authorization = authorizer.authorize(privateFile);

        await expect(authorization).rejects.toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("allows a private file to a signed-in identity", async () => {
        const authorizer = createAuthorizer(admin);
        const authorization = authorizer.authorize(privateFile);

        await expect(authorization).resolves.toBeUndefined();
    });

    it("allows a public file to a request without a token", async () => {
        const anonymous = new AnonymousIdentity();
        const authorizer = createAuthorizer(anonymous);
        const authorization = authorizer.authorize(publicFile);

        await expect(authorization).resolves.toBeUndefined();
    });
});
