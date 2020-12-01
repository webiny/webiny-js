import gql from "graphql-tag";

export const LOGIN = gql`
    mutation Login {
        security {
            login {
                data {
                    # identity specific fields
                    login
                    access {
                        id
                        name
                        permissions
                    }
                    # user-management specific fields
                    firstName
                    lastName
                    avatar
                    gravatar
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;
