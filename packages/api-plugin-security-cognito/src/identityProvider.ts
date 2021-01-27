import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { SecurityIdentityProviderPlugin } from "@webiny/api-security-tenancy/types";

const updateAttributes = { family_name: "lastName", given_name: "firstName" };

export default ({ region, userPoolId }) => {
    const cognito = new CognitoIdentityServiceProvider({ region });

    return [
        {
            type: "graphql-schema",
            name: "graphql-schema-cognito",
            schema: {
                typeDefs: /* GraphQL */ `
                    extend input SecurityInstallInput {
                        password: String
                    }

                    extend input SecurityUserInput {
                        password: String
                    }

                    # This input type is used by the user who is updating his own account
                    extend input SecurityCurrentUserInput {
                        password: String
                    }
                `
            }
        } as GraphQLSchemaPlugin,
        {
            name: "security-identity-provider",
            type: "security-identity-provider",
            async createUser({ data, permanent = false }) {
                try {
                    await cognito
                        .adminGetUser({
                            Username: data.login.toLowerCase(),
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
                    Username: data.login.toLowerCase(),
                    DesiredDeliveryMediums: [],
                    ForceAliasCreation: false,
                    MessageAction: "SUPPRESS",
                    TemporaryPassword: data.password,
                    UserAttributes: [
                        {
                            Name: "given_name",
                            Value: data.firstName
                        },
                        {
                            Name: "family_name",
                            Value: data.lastName
                        }
                    ]
                };

                await cognito.adminCreateUser(params).promise();
                // user.id = User.Attributes.find(attr => attr.Name === "sub").Value;

                const verify = {
                    UserPoolId: userPoolId,
                    Username: data.login.toLowerCase(),
                    UserAttributes: [
                        {
                            Name: "email_verified",
                            Value: "true"
                        }
                    ]
                };

                await cognito.adminUpdateUserAttributes(verify).promise();

                if (permanent) {
                    await cognito
                        .adminSetUserPassword({
                            Permanent: true,
                            Password: data.password,
                            Username: data.login.toLowerCase(),
                            UserPoolId: userPoolId
                        })
                        .promise();
                }
            },
            async updateUser({ data, user }) {
                const params = {
                    UserAttributes: Object.keys(updateAttributes).map(attr => {
                        return { Name: attr, Value: user[updateAttributes[attr]] };
                    }),
                    UserPoolId: userPoolId,
                    Username: user.login.toLowerCase()
                };

                await cognito.adminUpdateUserAttributes(params).promise();

                if (data.password) {
                    const pass = {
                        Permanent: true,
                        Password: data.password,
                        Username: user.login.toLowerCase(),
                        UserPoolId: userPoolId
                    };

                    await cognito.adminSetUserPassword(pass).promise();
                }
            },
            async deleteUser({ user }) {
                await cognito
                    .adminDeleteUser({ UserPoolId: userPoolId, Username: user.login.toLowerCase() })
                    .promise();
            }
        } as SecurityIdentityProviderPlugin<{ password: string }>
    ];
};
