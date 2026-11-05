import Error from "@webiny/error";
import type { File } from "~/domain/file/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { AssetAuthorizer } from "../abstractions/AssetAuthorizer.js";

/**
 * Private files can only be read by identities with File Manager read access in the file's
 * tenant. Being logged in is not enough: API keys (e.g. the public website key) and identities
 * from other tenants are authenticated too.
 */
export class PrivateAuthenticatedAuthorizer implements AssetAuthorizer.Interface {
    private identityContext: IdentityContext.Interface;
    private permissions: FmPermissions.Interface;

    constructor(identityContext: IdentityContext.Interface, permissions: FmPermissions.Interface) {
        this.identityContext = identityContext;
        this.permissions = permissions;
    }

    async authorize(file: File) {
        if (file.accessControl?.type !== "private-authenticated") {
            return;
        }

        if (this.identityContext.getIdentity().isAnonymous()) {
            throw this.notAuthorized();
        }

        if (!(await this.permissions.canRead("file"))) {
            throw this.notAuthorized();
        }
    }

    private notAuthorized() {
        return new Error({
            code: "NOT_AUTHORIZED",
            message: "You're not authorized to access this asset!"
        });
    }
}

export const PrivateAuthenticatedAuthorizerImpl = AssetAuthorizer.createImplementation({
    implementation: PrivateAuthenticatedAuthorizer,
    dependencies: [IdentityContext, FmPermissions]
});
