import CognitoIdentityServiceProvider from "aws-sdk/clients/cognitoidentityserviceprovider";
import { gql } from "apollo-server-lambda";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import request from "request-promise";
import util from "util";

const verify = util.promisify(jwt.verify);
let jwksCache = null;

export default ({ region, userPoolId }) => {
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

    const getJWKs = async () => {
        if (!jwksCache) {
            const body = await request({ url, json: true });
            jwksCache = body.keys;
        }

        return jwksCache;
    };

    const cognito = new CognitoIdentityServiceProvider();

    // The following attributes will
    const updateAttributes = { family_name: "lastName", given_name: "firstName" };
    const attrKeys = Object.keys(updateAttributes);

    return [
        {
            type: "graphql-schema",
            name: "graphql-schema-cognito",
            schema: {
                typeDefs: gql`
                    extend input SecurityUserInput {
                        password: String
                    }

                    # This input type is used by the user who is updating his own account
                    extend input SecurityCurrentUserInput {
                        password: String
                    }
                `
            }
        },
        {
            name: "security-authentication-provider-cognito",
            type: "security-authentication-provider",
            async getUser({ idToken, SecurityUser }) {
                const jwks = await getJWKs();
                const { header } = jwt.decode(idToken, { complete: true });
                const jwk = jwks.find(key => key.kid === header.kid);

                const token = await verify(idToken, jwkToPem(jwk));
                if (token.token_use !== "id") {
                    const error = new Error("idToken is invalid!");
                    throw Object.assign(error, {
                        code: "SECURITY_COGNITO_INVALID_TOKEN"
                    });
                }

                const user = await SecurityUser.findOne({ query: { email: token.email } });

                if (attrKeys.some(attr => token.hasOwnProperty(attr))) {
                    attrKeys.forEach(attr => {
                        user[updateAttributes[attr]] = token[attr];
                    });

                    await user.save();
                }

                return user;
            },
            async createUser({ data, user }) {
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
                await cognito.adminCreateUser(params).promise();

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
            },
            async updateUser({ data, user }) {
                const params = {
                    UserAttributes: attrKeys.map(attr => {
                        return { Name: attr, Value: user[updateAttributes[attr]] };
                    }),
                    UserPoolId: userPoolId,
                    Username: user.email
                };

                await cognito.adminUpdateUserAttributes(params).promise();

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
        }
    ];
};
