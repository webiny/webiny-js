const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
global.fetch = require("node-fetch");

const AWS_COGNITO = {
    USER_POOL_ID: Cypress.env("AWS_COGNITO_USER_POOL_ID"),
    CLIENT_ID: Cypress.env("AWS_COGNITO_CLIENT_ID")
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: AWS_COGNITO.USER_POOL_ID,
    ClientId: AWS_COGNITO.CLIENT_ID
});

export default ({ username, password }) => {
    const userData = {
        Username: username,
        Pool: userPool
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
