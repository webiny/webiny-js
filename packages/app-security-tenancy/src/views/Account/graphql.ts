import gql from "graphql-tag";

export const CREATE_PAT = gql`
    mutation CreatePAT($data: SecurityPersonalAccessTokenInput!) {
        security {
            createPAT(data: $data) {
                data {
                    pat {
                        id
                        name
                        token
                    }
                    token
                }
                error {
                    message
                }
            }
        }
    }
`;

export const UPDATE_PAT = gql`
    mutation UpdatePAT($id: ID!, $data: SecurityPersonalAccessTokenInput!) {
        security {
            updatePAT(id: $id, data: $data) {
                data {
                    id
                    name
                    token
                }
                error {
                    message
                }
            }
        }
    }
`;

export const DELETE_PAT = gql`
    mutation DeletePAT($id: ID!) {
        security {
            deletePAT(id: $id) {
                data
                error {
                    message
                }
            }
        }
    }
`;

export const GET_CURRENT_USER = gql`
    query GetCurrentUser {
        security {
            user: getCurrentUser {
                data {
                    login
                    firstName
                    lastName
                    avatar
                    personalAccessTokens {
                        id
                        name
                        token
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

export const UPDATE_CURRENT_USER = gql`
    mutation UpdateCurrentUser($data: SecurityCurrentUserInput!) {
        security {
            updateCurrentUser(data: $data) {
                data {
                    login
                    avatar
                }
            }
        }
    }
`;
