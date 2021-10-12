import gql from "graphql-tag";

export const LOGIN = gql`
    mutation Login {
        security {
            login {
                data {
                    ... on AdminUserIdentity {
                        id
                        displayName
                        type
                        tenant {
                            id
                            name
                            description
                            parent
                        }
                        permissions
                        profile {
                            email
                            firstName
                            lastName
                            avatar
                            gravatar
                        }
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
