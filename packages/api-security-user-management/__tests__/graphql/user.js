const DATA_FIELD = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        avatar
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const LOGIN = /* GraphQL */ `
    mutation login {
        security {
            login {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_SECURITY_USER = /* GraphQL */ `
    mutation CreateUser($data: SecurityUserInput!) {
        security {
            createUser(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: SecurityUserInput!) {
        security {
            updateUser(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_SECURITY_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        security {
            deleteUser(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_SECURITY_USERS = /* GraphQL */ `
    query ListUser {
        security {
            listUsers {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_USER = /* GraphQL */ `
    query GetUser($id: ID, $login: String) {
        security {
            getUser(id: $id, login: $login) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_CURRENT_SECURITY_USER = /* GraphQL */ `
    query GetCurrentUser {
        security {
            getCurrentUser {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_CURRENT_SECURITY_USER = /* GraphQL */ `
    mutation UpdateCurrentUser($data: SecurityCurrentUserInput!) {
        security {
            updateCurrentUser(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
