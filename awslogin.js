const { GraphQLClient } = require("graphql-request");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
global.fetch = require("node-fetch");

const USERNAME = "admin@webiny.com";
const PASSWORD = "12345678";

const poolData = {
    UserPoolId: "eu-central-1_86oEwTrQ6", // Your user pool id here
    ClientId: "1ajcsnt55dgqou7a4jhf6keoop" // Your client id here
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: USERNAME,
    Password: PASSWORD
});

const userData = {
    Username: USERNAME,
    Pool: userPool
};

const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

const ID_TOKEN_LOGIN = /* GraphQL */ `
    mutation IdTokenLogin($idToken: String!) {
        security {
            loginUsingIdToken(idToken: $idToken) {
                data {
                    token
                    user {
                        id
                        email
                        fullName
                        access {
                            scopes
                            roles
                            fullAccess
                            __typename
                        }
                        avatar {
                            src
                        }
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: async function(result) {
        const client = new GraphQLClient("https://d23wzps5l3odir.cloudfront.net/graphql");
        const webinyToken = await client.request(ID_TOKEN_LOGIN, {
            idToken: result.getIdToken().getJwtToken()
        }).then(response => {
            return response.security.loginUsingIdToken.data.token;
        });


        console.log('dobeo access', webinyToken)
    },
    onFailure: function(err) {
        console.log(err);
    }
});
