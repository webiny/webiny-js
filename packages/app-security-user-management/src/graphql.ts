import gql from "graphql-tag";

export const LOGIN = gql`
    mutation Login {
        security {
            login {
                data {
                    # identity specific fields
                    id
                    login
                    permissions
                    # user-management specific fields
                    fullName
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
