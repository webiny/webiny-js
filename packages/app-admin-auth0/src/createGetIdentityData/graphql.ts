import gql from "graphql-tag";

export const LOGIN_MT = gql`
    mutation Login {
        security {
            login {
                data {
                    ... on SecurityIdentity {
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
                    ... on Auth0Identity {
                        id
                        displayName
                        type
                        permissions
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
