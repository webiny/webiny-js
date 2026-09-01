import Error from "@webiny/error";
import type { File } from "~/domain/file/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AssetAuthorizer } from "../abstractions/AssetAuthorizer.js";

export class PrivateAuthenticatedAuthorizer implements AssetAuthorizer.Interface {
    private identityContext: IdentityContext.Interface;

    constructor(identityContext: IdentityContext.Interface) {
        this.identityContext = identityContext;
    }

    async authorize(file: File) {
        if (file.accessControl && file.accessControl.type === "private-authenticated") {
            const identity = this.identityContext.getIdentity();

            if (!identity) {
                throw new Error({
                    code: "NOT_AUTHORIZED",
                    message: "You're not authorized to access this asset!"
                });
            }
        }
    }
}

export const PrivateAuthenticatedAuthorizerImpl = AssetAuthorizer.createImplementation({
    implementation: PrivateAuthenticatedAuthorizer,
    dependencies: [IdentityContext]
});
