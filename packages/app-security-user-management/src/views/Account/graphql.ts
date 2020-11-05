import gql from "graphql-tag";

const ERROR_FIELDS = gql`
    {
        message
        code
        data
    }
`;

export const CREATE_PAT = gql`
    mutation createPat($name: String!, $userId: ID) {
        security {
            createPAT(name: $name, userId: $userId) {
                data {
                    pat {
                        id
                        name
                        token
                    }
                    token
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_PAT = gql`
    mutation($id: ID!, $data: PersonalAccessTokenInput!) {
        security {
            updatePAT(id: $id, data: $data) {
                data {
                    id
                    name
                    token
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const DELETE_PAT = gql`
    mutation deletePat($id: ID!) {
        security {
            deletePAT(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_CURRENT_USER = gql`
    {
        security {
            getCurrentUser {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                    personalAccessTokens {
                        id
                        name
                        token
                    }
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const UPDATE_CURRENT_USER = gql`
    mutation updateMe($data: SecurityCurrentUserInput!) {
        security {
            updateCurrentUser(data: $data) {
                data {
                    id
                    email
                    avatar
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;
