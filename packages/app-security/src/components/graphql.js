// @flow
import gql from "graphql-tag";

export const GET_CURRENT_USER = gql`
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
