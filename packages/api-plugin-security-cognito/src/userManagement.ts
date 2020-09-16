import gql from "graphql-tag";
import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import { SecurityUserManagementPlugin } from "@webiny/api-security-user-management/types";

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
            name: "security-user-management",
            type: "security-user-management",
            async createUser({ data, user, permanent = false }) {
                try {
                    const idpUser = await cognito
                        .adminGetUser({ Username: user.email, UserPoolId: userPoolId })
                        .promise();

                    user.id = idpUser.UserAttributes.find(attr => attr.Name === "sub").Value;
                    return;
                } catch {
                    // User does not exist
                }

                const params = {
                    UserPoolId: userPoolId,
                    Username: user.email,
                    DesiredDeliveryMediums: [],
                    ForceAliasCreation: false,
                    MessageAction: "SUPPRESS",
                    TemporaryPassword: data.password,
                    UserAttributes: [
                        {
                            Name: "given_name",
                            Value: user.firstName
                        },
                        {
                            Name: "family_name",
                            Value: user.lastName
                        }
                    ]
                };

                const { User } = await cognito.adminCreateUser(params).promise();
                user.id = User.Attributes.find(attr => attr.Name === "sub").Value;

                const verify = {
                    UserPoolId: userPoolId,
                    Username: user.email,
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
                            Username: user.email,
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
                        Username: user.email,
                        UserPoolId: userPoolId
                    };

                    await cognito.adminSetUserPassword(pass).promise();
                }
            },
            async deleteUser({ user }) {
                await cognito
                    .adminDeleteUser({ UserPoolId: userPoolId, Username: user.email })
                    .promise();
            }
        } as SecurityUserManagementPlugin
    ];
};
