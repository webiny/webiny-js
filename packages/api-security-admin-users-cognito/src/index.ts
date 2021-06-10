import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { UserPlugin } from "@webiny/api-security-admin-users/plugins/UserPlugin";

const updateAttributes = { family_name: "lastName", given_name: "firstName" };

export default ({ region, userPoolId }) => {
    const cognito = new CognitoIdentityServiceProvider({ region });

    return [
        new GraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                extend input SecurityInstallInput {
                    password: String
                }

                extend input SecurityUserCreateInput {
                    password: String
                }

                extend input SecurityUserUpdateInput {
                    password: String
                }

                # This input type is used by the user who is updating his own account
                extend input SecurityCurrentUserInput {
                    password: String
                }
            `
        }),
        new UserPlugin({
            async beforeCreate({ inputData, context }) {
                try {
                    await cognito
                        .adminGetUser({
                            Username: inputData.login.toLowerCase(),
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
                    Username: inputData.login.toLowerCase(),
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
                        }
                    ]
                };

                await cognito.adminCreateUser(params).promise();
                // user.id = User.Attributes.find(attr => attr.Name === "sub").Value;

                const verify = {
                    UserPoolId: userPoolId,
                    Username: inputData.login.toLowerCase(),
                    UserAttributes: [
                        {
                            Name: "email_verified",
                            Value: "true"
                        }
                    ]
                };

                await cognito.adminUpdateUserAttributes(verify).promise();

                // Check if this is the first user in the system, and if so, set permanent password.
                const users = await context.security.users.listUsers({ auth: false });

                if (!users.length) {
                    await cognito
                        .adminSetUserPassword({
                            Permanent: true,
                            Password: inputData.password,
                            Username: inputData.login.toLowerCase(),
                            UserPoolId: userPoolId
                        })
                        .promise();
                }
            },
            async afterUpdate({ inputData, user }) {
                const params = {
                    UserAttributes: Object.keys(updateAttributes).map(attr => {
                        return { Name: attr, Value: user[updateAttributes[attr]] };
                    }),
                    UserPoolId: userPoolId,
                    Username: user.login.toLowerCase()
                };

                await cognito.adminUpdateUserAttributes(params).promise();

                if (inputData.password) {
                    const pass = {
                        Permanent: true,
                        Password: inputData.password,
                        Username: user.login.toLowerCase(),
                        UserPoolId: userPoolId
                    };

                    await cognito.adminSetUserPassword(pass).promise();
                }
            },
            async afterDelete({ user }) {
                await cognito
                    .adminDeleteUser({ UserPoolId: userPoolId, Username: user.login.toLowerCase() })
                    .promise();
            }
        })
    ];
};
