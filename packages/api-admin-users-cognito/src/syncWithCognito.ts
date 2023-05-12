import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
import { AdminUser, AdminUsersContext, BaseUserAttributes } from "~/types";

type MappedAttrType = (user: AdminUser) => string | keyof AdminUser;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

export interface AttributeGetter {
    (user: BaseUserAttributes): string;
}

interface CognitoConfigAutoVerify {
    email?: boolean;
}
export interface CognitoConfig {
    region: string;
    userPoolId: string;
    updateAttributes?: Record<string, string | AttributeGetter>;
    getUsername?<TUser extends BaseUserAttributes = BaseUserAttributes>(user: TUser): string;
    autoVerify?: CognitoConfigAutoVerify;
}

const defaultGetUsername: CognitoConfig["getUsername"] = (user: BaseUserAttributes) =>
    user.email.toLowerCase();

const defaultAutoVerify: CognitoConfigAutoVerify = {
    email: true
};

export const syncWithCognito = ({
    getUsername: initialGetUsername,
    region,
    userPoolId,
    autoVerify: initialAutoVerify,
    updateAttributes: initialUpdateAttributes
}: CognitoConfig) => {
    const getUsername = initialGetUsername ? initialGetUsername : defaultGetUsername;

    const autoVerify = initialAutoVerify ? initialAutoVerify : defaultAutoVerify;

    const updateAttributes = initialUpdateAttributes
        ? initialUpdateAttributes
        : defaultUpdateAttributes;

    const cognito = new CognitoIdentityServiceProvider({ region });

    return new ContextPlugin<AdminUsersContext>(({ adminUsers }) => {
        adminUsers.onUserBeforeCreate.subscribe(async ({ user, inputData }) => {
            // Immediately delete password from `user`, as that object will be stored to the database.
            // Password field is attached by Cognito plugin, so we only want this plugin to handle it.
            // Casting as any because password does not exist on user, but we know it does
            delete (user as any)["password"];

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

            const params: CognitoIdentityServiceProvider.Types.AdminCreateUserRequest = {
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

            await cognito.adminCreateUser(params).promise();

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
            // Casting as any because password does not exist on user, but we know it does
            delete (updateData as any)["password"];
        });

        adminUsers.onUserAfterUpdate.subscribe(async ({ originalUser, updatedUser, inputData }) => {
            const newAttributes = Object.keys(updateAttributes).map(attr => {
                const mappedAttr = updateAttributes[attr] as MappedAttrType;
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

            const { password } = (inputData as any) || {};
            if (password) {
                const pass = {
                    Permanent: true,
                    Password: password,
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
