const DATA_FIELD = /* GraphQL */ `
    {
        login
        firstName
        lastName
        avatar
        gravatar
        group {
            slug
            name
        }
    }
`;

const DATA_FIELD_SECURITY_IDENTITY = /* GraphQL */ `
    {
        login
        firstName
        lastName
        avatar
        gravatar
        access {
            id
            name
            permissions
        }
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
                data ${DATA_FIELD_SECURITY_IDENTITY}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_SECURITY_USER = /* GraphQL */ `
    mutation CreateUser($data: SecurityUserCreateInput!) {
        security {
            createUser(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_USER = /* GraphQL */ `
    mutation UpdateUser($login: String!, $data: SecurityUserUpdateInput!) {
        security {
            updateUser(login: $login, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_SECURITY_USER = /* GraphQL */ `
    mutation DeleteUser($login: String!) {
        security {
            deleteUser(login: $login) {
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
    query GetUser($login: String!) {
        security {
            getUser(login: $login) {
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
                data {
                    login
                    firstName
                    lastName
                    avatar
                }
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
