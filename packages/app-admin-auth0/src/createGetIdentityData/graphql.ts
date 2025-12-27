import gql from "graphql-tag";

export const LOGIN = gql`
    mutation Login {
        security {
            login {
                data {
                    ... on Auth0Identity {
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
