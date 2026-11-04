import { describe, expect, it } from "vitest";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    type IdentityContext,
    type Identity
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { PrivateAuthenticatedAuthorizer } from "~/features/assetDelivery/privateFiles/PrivateAuthenticatedAuthorizer.js";
import type { File } from "~/domain/file/types.js";

const createAuthorizer = (identity: Identity) => {
    const identityContext = {
        getIdentity: () => identity
    } as unknown as IdentityContext.Interface;
    return new PrivateAuthenticatedAuthorizer(identityContext);
};

const createFile = (accessControl?: File["accessControl"]) => {
    return { id: "file-1", key: "file-1/image.png", accessControl } as unknown as File;
};

const loggedIn = () => {
    return new AuthenticatedIdentity({ id: "user-1", displayName: "User 1", type: "admin" });
};

describe("PrivateAuthenticatedAuthorizer", () => {
    it("should refuse anonymous identities for private-authenticated files", async () => {
        const authorizer = createAuthorizer(new AnonymousIdentity());

        await expect(
            authorizer.authorize(createFile({ type: "private-authenticated" }))
        ).rejects.toMatchObject({ code: "NOT_AUTHORIZED" });
    });

    it("should allow logged-in identities for private-authenticated files", async () => {
        const authorizer = createAuthorizer(loggedIn());

        await expect(
            authorizer.authorize(createFile({ type: "private-authenticated" }))
        ).resolves.toBeUndefined();
    });

    it.each([
        ["no access control", undefined],
        ["public access", { type: "public" }]
    ])("should allow anonymous identities for files with %s", async (_, accessControl) => {
        const authorizer = createAuthorizer(new AnonymousIdentity());

        await expect(
            authorizer.authorize(createFile(accessControl as File["accessControl"]))
        ).resolves.toBeUndefined();
    });
});
