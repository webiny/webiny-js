// @flow
import gql from "graphql-tag";

const dataFields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        gravatar
    }
`;

export const GET_CURRENT_USER = gql`
    {
        security {
            getCurrentUser {
                data ${dataFields}
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
        loginUsingIdToken(idToken: $idToken) {
            data {
                token
                user ${dataFields}
            }
            error {
                code
                message
            }
        }
    }
`;
