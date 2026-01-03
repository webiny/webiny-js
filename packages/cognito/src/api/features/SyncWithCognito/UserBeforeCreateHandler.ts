import type { AdminCreateUserRequest } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import { CognitoIdentityProvider } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import WebinyError from "@webiny/error";
import { UserBeforeCreateHandler } from "@webiny/api-core/features/CreateUser";
import { ListUsersUseCase } from "@webiny/api-core/features/ListUsers";
import { createImplementation } from "@webiny/feature/api";
import { CognitoConfig } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";


class UserBeforeCreateHandlerImpl implements UserBeforeCreateHandler.Interface {
    private cognito: CognitoIdentityProvider;

    constructor(
        private config: CognitoConfig.Interface,
        private listUsersUseCase: ListUsersUseCase.Interface
    ) {
        this.cognito = new CognitoIdentityProvider({ region: config.region });
    }

    async handle(event: UserBeforeCreateHandler.Event): Promise<void> {
        const { user, input } = event.payload;

        if (input.external) {
            return;
        }

        // Immediately delete password from `user`, as that object will be stored to the database.
        // Password field is attached by Cognito plugin, so we only want this plugin to handle it.
        // @ts-expect-error
        delete user["password"];

        const username = Username.fromUser(input);

        try {
            await this.cognito.adminGetUser({
                Username: username,
                UserPoolId: this.config.userPoolId
            });

            // User exists; there are multiple ways to resolve the conflict
            // but for now, we simply prevent user creation.
            throw new WebinyError({
                message: `An account with this email already exists in your Cognito User Pool.`,
                code: "COGNITO_ACCOUNT_EXISTS"
            });
        } catch (err) {
            if (err.code === "COGNITO_ACCOUNT_EXISTS") {
                throw err;
            }

            // User does not exist.
        }

        const params: AdminCreateUserRequest = {
            UserPoolId: this.config.userPoolId,
            Username: username,
            DesiredDeliveryMediums: [],
            ForceAliasCreation: false,
            MessageAction: "SUPPRESS",
            TemporaryPassword: input.password,
            UserAttributes: [
                {
                    Name: "given_name",
                    Value: input.firstName
                },
                {
                    Name: "family_name",
                    Value: input.lastName
                },
                {
                    Name: "preferred_username",
                    Value: username
                },
                {
                    Name: "email",
                    Value: username
                },
                {
                    Name: "custom:id",
                    Value: user.id
                }
            ]
        };

        await this.cognito.adminCreateUser(params);

        const verify = {
            UserPoolId: this.config.userPoolId,
            Username: username,
            UserAttributes: [
                {
                    Name: "email_verified",
                    Value: "true"
                }
            ]
        };

        await this.cognito.adminUpdateUserAttributes(verify);

        // Check if this is the first user in the system, and if so, set permanent password.
        const usersResult = await this.listUsersUseCase.execute();
        if (usersResult.isFail()) {
            throw new Error(`Failed to list users: ${usersResult.error.message}`);
        }

        const users = usersResult.value;

        if (!users.length) {
            await this.cognito.adminSetUserPassword({
                Permanent: true,

                // With Cognito, we are sure the password will be included
                // in the user creation input data.
                Password: input.password!,

                Username: username,
                UserPoolId: this.config.userPoolId
            });
        }
    }
}

export const CognitoUserBeforeCreateHandler = createImplementation({
    abstraction: UserBeforeCreateHandler,
    implementation: UserBeforeCreateHandlerImpl,
    dependencies: [CognitoConfig, ListUsersUseCase]
});
