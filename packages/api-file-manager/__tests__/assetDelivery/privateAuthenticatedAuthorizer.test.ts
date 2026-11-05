import { describe, expect, it } from "vitest";
import {
    AnonymousIdentity,
    AuthenticatedIdentity,
    type IdentityContext,
    type Identity
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { FmPermissions } from "~/features/shared/abstractions.js";
import { PrivateAuthenticatedAuthorizer } from "~/features/assetDelivery/privateFiles/PrivateAuthenticatedAuthorizer.js";
import type { File } from "~/domain/file/types.js";

const createAuthorizer = (identity: Identity, canReadFiles: boolean) => {
    const identityContext = {
        getIdentity: () => identity
    } as unknown as IdentityContext.Interface;
    const permissions = {
        canRead: async (entity: string) => entity === "file" && canReadFiles
    } as unknown as FmPermissions.Interface;
    return new PrivateAuthenticatedAuthorizer(identityContext, permissions);
};

const createFile = (accessControl?: File["accessControl"]) => {
    return { id: "file-1", key: "file-1/image.png", accessControl } as unknown as File;
};

const loggedIn = () => {
    return new AuthenticatedIdentity({ id: "user-1", displayName: "User 1", type: "admin" });
};

const privateFile = () => createFile({ type: "private-authenticated" });

describe("PrivateAuthenticatedAuthorizer", () => {
    it("should refuse anonymous identities for private files", async () => {
        const authorizer = createAuthorizer(new AnonymousIdentity(), true);

        await expect(authorizer.authorize(privateFile())).rejects.toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("should refuse logged-in identities without File Manager read access", async () => {
        // e.g. the public website API key, or a user from another tenant.
        const authorizer = createAuthorizer(loggedIn(), false);

        await expect(authorizer.authorize(privateFile())).rejects.toMatchObject({
            code: "NOT_AUTHORIZED"
        });
    });

    it("should allow logged-in identities with File Manager read access", async () => {
        const authorizer = createAuthorizer(loggedIn(), true);

        await expect(authorizer.authorize(privateFile())).resolves.toBeUndefined();
    });

    it.each([
        ["no access control", undefined],
        ["public access", { type: "public" }]
    ])("should allow anyone to read files with %s", async (_, accessControl) => {
        const authorizer = createAuthorizer(new AnonymousIdentity(), false);

        await expect(
            authorizer.authorize(createFile(accessControl as File["accessControl"]))
        ).resolves.toBeUndefined();
    });
});
