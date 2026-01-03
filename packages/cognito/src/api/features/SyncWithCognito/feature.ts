import { createFeature } from "@webiny/feature/api";
import { CognitoUserBeforeCreateHandler } from "./UserBeforeCreateHandler.js";
import { CognitoUserBeforeUpdateHandler } from "./UserBeforeUpdateHandler.js";
import { CognitoUserAfterUpdateHandler } from "./UserAfterUpdateHandler.js";
import { CognitoUserAfterDeleteHandler } from "./UserAfterDeleteHandler.js";
import { CognitoConfig } from "./abstractions.js";

export const SyncWithCognitoFeature = createFeature({
    name: "SyncWithCognitoFeature",
    register(container) {
        // Register the CognitoConfig instance
        container.registerInstance(CognitoConfig, {
            region: process.env.COGNITO_REGION,
            userPoolId: process.env.COGNITO_USER_POOL_ID
        });

        // Register event handlers
        container.register(CognitoUserBeforeCreateHandler);
        container.register(CognitoUserBeforeUpdateHandler);
        container.register(CognitoUserAfterUpdateHandler);
        container.register(CognitoUserAfterDeleteHandler);
    }
});
