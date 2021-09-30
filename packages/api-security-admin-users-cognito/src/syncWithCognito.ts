import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { AdminUsersContext, BaseUserAttributes } from "~/types";

type Context = SecurityContext & AdminUsersContext;

const updateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

export interface CognitoConfig {
    region: string;
    userPoolId: string;
    getUsername?<TUser extends BaseUserAttributes = BaseUserAttributes>(user: TUser): string;
    autoVerify?: {
        email?: boolean;
    };
}

const defaultGetUsername = (user: BaseUserAttributes) => user.email.toLowerCase();

export const syncWithCognito = ({ getUsername, region, userPoolId, autoVerify }: CognitoConfig) => {
    if (!getUsername) {
        getUsername = defaultGetUsername;
    }

    if (!autoVerify) {
        autoVerify = { email: true };
    }

    const cognito = new CognitoIdentityServiceProvider({ region });

    return new ContextPlugin<Context>(({ security, adminUsers }) => {
        adminUsers.onUserBeforeCreate.subscribe(async ({ user, inputData }) => {
            // Immediately delete password from `user`, as that object will be stored to the database.
            // Password field is attached by Cognito plugin, so we only want this plugin to handle it.
            delete user["password"];

            const username = getUsername(inputData);

            try {
                await cognito
                    .adminGetUser({
                        Username: username,
                        UserPoolId: userPoolId
                    })
                    .promise();

                // User exists
                return;
            } catch {
                // User does not exist
            }

            const params = {
                UserPoolId: userPoolId,
                Username: username,
                DesiredDeliveryMediums: [],
                ForceAliasCreation: false,
                MessageAction: "SUPPRESS",
                TemporaryPassword: inputData.password,
                UserAttributes: [
                    {
                        Name: "given_name",
                        Value: inputData.firstName
                    },
                    {
                        Name: "family_name",
                        Value: inputData.lastName
                    },
                    {
                        Name: "preferred_username",
                        Value: username
                    }
                ]
            };

            const { User } = await cognito.adminCreateUser(params).promise();
            user.id = User.Attributes.find(attr => attr.Name === "sub").Value;

            const verify = {
                UserPoolId: userPoolId,
                Username: username,
                UserAttributes: [
                    {
                        Name: "email_verified",
                        Value: autoVerify.email ? "true" : "false"
                    }
                ]
            };

            await cognito.adminUpdateUserAttributes(verify).promise();

            // Check if this is the first user in the system, and if so, set permanent password.
            security.disableAuthorization();
            const users = await adminUsers.listUsers();
            security.enableAuthorization();

            if (!users.length) {
                await cognito
                    .adminSetUserPassword({
                        Permanent: true,
                        Password: inputData.password,
                        Username: username,
                        UserPoolId: userPoolId
                    })
                    .promise();
            }
        });

        adminUsers.onUserBeforeUpdate.subscribe(({ updateData }) => {
            // Immediately delete password from `updateData`, as that object will be merged with the `user` data.
            delete updateData["password"];
        });

        adminUsers.onUserAfterUpdate.subscribe(async ({ updatedUser, inputData }) => {
            const username = getUsername(updatedUser);

            const params = {
                UserAttributes: Object.keys(updateAttributes).map(attr => {
                    return { Name: attr, Value: updatedUser[updateAttributes[attr]] };
                }),
                UserPoolId: userPoolId,
                Username: username
            };

            await cognito.adminUpdateUserAttributes(params).promise();

            if (inputData.password) {
                const pass = {
                    Permanent: true,
                    Password: inputData.password,
                    Username: username,
                    UserPoolId: userPoolId
                };

                await cognito.adminSetUserPassword(pass).promise();
            }
        });

        adminUsers.onUserAfterDelete.subscribe(async ({ user }) => {
            await cognito
                .adminDeleteUser({ UserPoolId: userPoolId, Username: getUsername(user) })
                .promise();
        });
    });
};
