const { GraphQLClient } = require("graphql-request");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
global.fetch = require("node-fetch");

const GRAPHQL_API_URL = Cypress.env("GRAPHQL_API_URL");

const AWS_COGNITO = {
    USER_POOL_ID: Cypress.env("AWS_COGNITO_USER_POOL_ID"),
    CLIENT_ID: Cypress.env("AWS_COGNITO_CLIENT_ID")
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: AWS_COGNITO.USER_POOL_ID,
    ClientId: AWS_COGNITO.CLIENT_ID
});

const LOGIN = /* GraphQL */ `
    mutation Login {
        security {
            login {
                data {
                    login
                    access {
                        id
                        name
                        permissions
                        __typename
                    }
                    firstName
                    lastName
                    avatar
                    gravatar
                    __typename
                }
                __typename
            }
            __typename
        }
    }
`;

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
            onFailure: function(err) {
                console.log(`An error occurred while executing login command ("cognitoUser.authenticateUser")`, err);
                reject(err);
            }
        });
    });
};
