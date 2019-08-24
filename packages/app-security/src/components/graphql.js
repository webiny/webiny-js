// @flow
import gql from "graphql-tag";

export const getCurrentUser = gql`
    {
        security {
            getCurrentUser {
                data {
                    id
                    email
                    fullName
                    access {
                        scopes
                        roles
                        fullAccess
                    }
                    avatar {
                        id
                        src
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

export const loginUsingToken = gql`
    mutation LoginUsingToken($token: String!) {
        security {
            loginUsingToken(token: $token) {
                data {
                    token
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
