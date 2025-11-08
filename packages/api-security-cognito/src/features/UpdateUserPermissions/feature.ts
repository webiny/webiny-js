import { createFeature } from "@webiny/feature/api";
import { CognitoUserAfterCreateHandler } from "./handlers/UserAfterCreateHandler.js";
import { CognitoUserAfterUpdateHandler } from "./handlers/UserAfterUpdateHandler.js";
import { CognitoUserAfterDeleteHandler } from "./handlers/UserAfterDeleteHandler.js";

export const UpdateUserPermissions = createFeature({
    name: "UpdateUserPermissions",
    register(container) {
        // Register event handlers
        container.register(CognitoUserAfterCreateHandler);
        container.register(CognitoUserAfterUpdateHandler);
        container.register(CognitoUserAfterDeleteHandler);
    }
});
