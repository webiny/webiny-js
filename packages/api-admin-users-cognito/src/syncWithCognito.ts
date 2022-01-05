import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler";
import { SecurityContext } from "@webiny/api-security/types";
import { AdminUsersContext, BaseUserAttributes } from "~/types";

type Context = SecurityContext & AdminUsersContext;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

export interface AttributeGetter {
    (user: BaseUserAttributes): string;
}

export interface CognitoConfig {
    region: string;
    userPoolId: string;
    updateAttributes?: Record<string, string | AttributeGetter>;
    getUsername?<TUser extends BaseUserAttributes = BaseUserAttributes>(user: TUser): string;
    autoVerify?: {
        email?: boolean;
    };
}

const defaultGetUsername = (user: BaseUserAttributes) => user.email.toLowerCase();

export const syncWithCognito = ({
    getUsername,
    region,
    userPoolId,
    autoVerify,
    updateAttributes
}: CognitoConfig) => {
    if (!getUsername) {
        getUsername = defaultGetUsername;
    }

    if (!autoVerify) {
        autoVerify = { email: true };
    }

    if (!updateAttributes) {
        updateAttributes = defaultUpdateAttributes;
    }

    const cognito = new CognitoIdentityServiceProvider({ region });

    return new ContextPlugin<Context>(({ adminUsers }) => {
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
            const users = await adminUsers.listUsers();

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

        adminUsers.onUserAfterUpdate.subscribe(async ({ originalUser, updatedUser, inputData }) => {
            const newAttributes = Object.keys(updateAttributes).map(attr => {
                const mappedAttr = updateAttributes[attr];
                const attrValue =
                    typeof mappedAttr === "function"
                        ? mappedAttr(updatedUser)
                        : updatedUser[mappedAttr];
                return { Name: attr, Value: attrValue };
            });

            if (originalUser.email !== updatedUser.email) {
                newAttributes.push({
                    Name: "email_verified",
                    Value: autoVerify.email ? "true" : "false"
                });
            }

            const params = {
                UserAttributes: newAttributes,
                UserPoolId: userPoolId,
                Username: getUsername(originalUser)
            };

            await cognito.adminUpdateUserAttributes(params).promise();

            if (inputData.password) {
                const pass = {
                    Permanent: true,
                    Password: inputData.password,
                    Username: getUsername(updatedUser),
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
