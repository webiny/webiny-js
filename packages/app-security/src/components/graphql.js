// @flow
import gql from "graphql-tag";

const userFields = /* GraphQL */ `
    {
        id
        email
        fullName
        access {
            scopes
            roles
            fullAccess
        }
        avatar {
            src
        }
    }
`;

export const GET_CURRENT_USER = gql`
    {
        security {
            getCurrentUser {
                data ${userFields}
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const ID_TOKEN_LOGIN = gql`
    mutation IdTokenLogin($idToken: String!) {
        security {
            loginUsingIdToken(idToken: $idToken) {
                data {
                    token
                    user ${userFields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
