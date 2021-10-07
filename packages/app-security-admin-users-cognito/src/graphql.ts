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
                        }
                        permissions
                        profile {
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
