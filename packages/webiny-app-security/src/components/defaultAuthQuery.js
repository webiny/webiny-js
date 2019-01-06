// @flow
import gql from "graphql-tag";

export default gql`
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
