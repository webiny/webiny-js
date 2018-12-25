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
                    scopes
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
