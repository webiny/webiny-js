const { GraphQLClient } = require("graphql-request");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
global.fetch = require("node-fetch");

const GRAPHQL_API_URL = "https://d23wzps5l3odir.cloudfront.net/graphql";

const AWS_COGNITO = {
    USER_POOL_ID: "eu-central-1_86oEwTrQ6",
    CLIENT_ID: "1ajcsnt55dgqou7a4jhf6keoop"
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: AWS_COGNITO.USER_POOL_ID,
    ClientId: AWS_COGNITO.CLIENT_ID
});

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
            onSuccess: async function(result) {
                const client = new GraphQLClient(GRAPHQL_API_URL);
                const webinyToken = await client
                    .request(ID_TOKEN_LOGIN, {
                        idToken: result.getIdToken().getJwtToken()
                    })
                    .then(response => {
                        return response.security.loginUsingIdToken.data.token;
                    });
                resolve(webinyToken);
            },
            onFailure: function(err) {
                reject(err);
            }
        });
    });
};
