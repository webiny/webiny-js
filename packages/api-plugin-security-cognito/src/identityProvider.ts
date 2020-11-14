import gql from "graphql-tag";
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import { SecurityIdentityProviderPlugin } from "@webiny/api-security-tenancy/types";

export default ({ region, userPoolId }) => {
    const cognito = new CognitoIdentityServiceProvider({ region });

    return [
        {
            type: "graphql-schema",
            name: "graphql-schema-cognito",
            schema: {
                typeDefs: gql`
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
                        .adminGetUser({ Username: data.login, UserPoolId: userPoolId })
                        .promise();

                    // User exists
                    return;
                } catch {
                    // User does not exist
                }

                const params = {
                    UserPoolId: userPoolId,
                    Username: data.login,
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
                    Username: data.login,
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
                            Username: data.login,
                            UserPoolId: userPoolId
                        })
                        .promise();
                }
            },
            async updateUser({ data, user }) {
                if (data.password) {
                    const pass = {
                        Permanent: true,
                        Password: data.password,
                        Username: user.login,
                        UserPoolId: userPoolId
                    };

                    await cognito.adminSetUserPassword(pass).promise();
                }
            },
            async deleteUser({ user }) {
                await cognito
                    .adminDeleteUser({ UserPoolId: userPoolId, Username: user.login })
                    .promise();
            }
        } as SecurityIdentityProviderPlugin<{ password: string }>
    ];
};
