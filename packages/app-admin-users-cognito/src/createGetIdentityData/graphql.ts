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
                        currentTenant {
                            id
                            name
                            description
                            image
                            parent
                        }
                        defaultTenant {
                            id
                            name
                            description
                            image
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
