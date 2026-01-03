import { createImplementation } from "@webiny/feature/api";
import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { UserAfterDeleteHandler } from "@webiny/api-core/features/DeleteUser";
import { CognitoConfig } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";

class UserAfterDeleteHandlerImpl implements UserAfterDeleteHandler.Interface {
    private cognito: CognitoIdentityProvider;

    constructor(private config: CognitoConfig.Interface) {
        this.cognito = new CognitoIdentityProvider({ region: config.region });
    }

    async handle(event: UserAfterDeleteHandler.Event): Promise<void> {
        const { user } = event.payload;

        if (user.external) {
            return;
        }

        await this.cognito.adminDeleteUser({
            UserPoolId: this.config.userPoolId,
            Username: Username.fromUser(user)
        });
    }
}

export const CognitoUserAfterDeleteHandler = createImplementation({
    abstraction: UserAfterDeleteHandler,
    implementation: UserAfterDeleteHandlerImpl,
    dependencies: [CognitoConfig]
});
