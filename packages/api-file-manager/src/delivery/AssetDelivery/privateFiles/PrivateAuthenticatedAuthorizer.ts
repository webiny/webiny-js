import Error from "@webiny/error";
import { File, FileManagerContext } from "~/types";
import { AssetAuthorizer } from "./AssetAuthorizer";

export class PrivateAuthenticatedAuthorizer implements AssetAuthorizer {
    private context: FileManagerContext;

    constructor(context: FileManagerContext) {
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
