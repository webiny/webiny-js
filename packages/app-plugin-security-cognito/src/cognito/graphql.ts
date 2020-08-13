import gql from "graphql-tag";

export const LOGIN = gql`
    mutation Login {
        security {
            login {
                data {
                    id
                    email
                    firstName
                    lastName
                    fullName
                    avatar {
                        src
                    }
                    gravatar
                    permissions
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
