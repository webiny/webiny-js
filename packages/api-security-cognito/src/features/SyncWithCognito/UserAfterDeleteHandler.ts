import { createImplementation } from "@webiny/feature/api";
import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { UserAfterDeleteHandler } from "@webiny/api-core/features/DeleteUser";
import { CognitoConfig, type ICognitoConfig } from "./abstractions.js";

type GetUsername = NonNullable<ICognitoConfig["getUsername"]>;

const defaultGetUsername: GetUsername = user => user.email.toLowerCase();

class UserAfterDeleteHandlerImpl implements UserAfterDeleteHandler.Interface {
    private cognito: CognitoIdentityProvider;
    private getUsername: GetUsername;

    constructor(private config: CognitoConfig.Interface) {
        this.cognito = new CognitoIdentityProvider({ region: config.region });
        this.getUsername = config.getUsername || defaultGetUsername;
    }

    async handle(event: UserAfterDeleteHandler.Event): Promise<void> {
        const { user } = event.payload;

        if (user.external) {
            return;
        }

        await this.cognito.adminDeleteUser({
            UserPoolId: this.config.userPoolId,
            Username: this.getUsername(user)
        });
    }
}

export const CognitoUserAfterDeleteHandler = createImplementation({
    abstraction: UserAfterDeleteHandler,
    implementation: UserAfterDeleteHandlerImpl,
    dependencies: [CognitoConfig]
});
