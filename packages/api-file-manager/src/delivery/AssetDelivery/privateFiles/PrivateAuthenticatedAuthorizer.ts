import Error from "@webiny/error";
import type { File } from "~/domain/file/types.js";
import type { AssetAuthorizer } from "./AssetAuthorizer.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export class PrivateAuthenticatedAuthorizer implements AssetAuthorizer {
    private context: ApiCoreContext;

    constructor(context: ApiCoreContext) {
        this.context = context;
    }

    async authorize(file: File) {
        if (file.accessControl && file.accessControl.type === "private-authenticated") {
            // Make sure there's a valid identity!
            const identity = this.context.security.getIdentity();

            if (!identity) {
                throw new Error({
                    code: "NOT_AUTHORIZED",
                    message: "You're not authorized to access this asset!"
                });
            }
        }
    }
}
