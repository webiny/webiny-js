import gql from "graphql-tag";

export const LOGIN_MT = gql`
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
                            parent
                        }
                        defaultTenant {
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

export const LOGIN_ST = gql`
    mutation Login {
        security {
            login {
                data {
                    ... on AdminUserIdentity {
                        id
                        displayName
                        type
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
