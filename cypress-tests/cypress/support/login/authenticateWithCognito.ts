import * as AmazonCognitoIdentity from "amazon-cognito-identity-js";

// @ts-expect-error
global.fetch = fetch;

// Constructed on first use, NOT at import time. `CognitoUserPool` throws "Both UserPoolId and
// ClientId are required." when either is missing, and this module is pulled in by the support file
// for EVERY spec - so building it eagerly made the whole suite fail to load on any setup without
// Cognito, before a single test ran. The self-hosted (server) hosting type has its own identity
// provider and leaves these blank.
let userPool: AmazonCognitoIdentity.CognitoUserPool | undefined;

const getUserPool = () => {
    if (!userPool) {
        userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: Cypress.env("AWS_COGNITO_USER_POOL_ID"),
            ClientId: Cypress.env("AWS_COGNITO_CLIENT_ID")
        });
    }

    return userPool;
};

export default ({ username, password }: { username: string; password: string }) => {
    const userData = {
        Username: username,
        Pool: getUserPool()
    };

    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: username,
        Password: password
    });

    return new Promise((resolve, reject) => {
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: resolve,
            onFailure: function (err) {
                console.log(
                    `An error occurred while executing login command ("cognitoUser.authenticateUser")`,
                    err
                );
                reject(err);
            },
            newPasswordRequired: function (userAttributes) {
                delete userAttributes.email_verified; // it's returned but not valid to submit

                const newPassword = "12345678";
                userAttributes.email = username;

                cognitoUser.completeNewPasswordChallenge(newPassword, null, {
                    onSuccess: resolve,
                    onFailure: function (err) {
                        console.log(
                            `An error occurred while executing login command ("cognitoUser.completeNewPasswordChallenge")`,
                            err,
                            userAttributes
                        );
                        reject(err);
                    }
                });
            }
        });

        return cognitoUser;
    });
};
