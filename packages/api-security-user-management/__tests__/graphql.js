export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        security {
            isInstalled {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation Install($data: SecurityInstallInput!) {
        security {
            install(data: $data) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const CREATE_SECURITY_GROUP = /* GraphQL */ `
    mutation CreateGroup($data: SecurityGroupInput!) {
        security {
            createGroup(data: $data) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const UPDATE_SECURITY_GROUP = /* GraphQL */ `
    mutation UpdateGroup($id: ID!, $data: SecurityGroupInput!) {
        security {
            updateGroup(id: $id, data: $data) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const DELETE_SECURITY_GROUP = /* GraphQL */ `
    mutation DeleteGroup($id: ID!) {
        security {
            deleteGroup(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const LIST_SECURITY_GROUPS = /* GraphQL */ `
    query ListGroups($where: ListSecurityGroupWhereInput, $sort: Int) {
        security {
            listGroups(where: $where, sort: $sort) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const GET_SECURITY_GROUP = /* GraphQL */ `
    query GetGroup($id: ID, $slug: String) {
        security {
            getGroup(id: $id, slug: $slug) {
                data {
                    id
                    name
                    description
                    slug
                    permissions
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const LOGIN = /* GraphQL */ `
    mutation login {
        security {
            login {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const CREATE_SECURITY_USER = /* GraphQL */ `
    mutation CreateUser($data: SecurityUserInput!) {
        security {
            createUser(data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const UPDATE_SECURITY_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: SecurityUserInput!) {
        security {
            updateUser(id: $id, data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const DELETE_SECURITY_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        security {
            deleteUser(id: $id) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const LIST_SECURITY_USERS = /* GraphQL */ `
    query ListUser {
        security {
            listUsers {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const GET_SECURITY_USER = /* GraphQL */ `
    query GetUser($id: ID, $login: String) {
        security {
            getUser(id: $id, login: $login) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const GET_CURRENT_SECURITY_USER = /* GraphQL */ `
    query GetCurrentUser {
        security {
            getCurrentUser {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const UPDATE_CURRENT_SECURITY_USER = /* GraphQL */ `
    mutation UpdateCurrentUser($data: SecurityCurrentUserInput!) {
        security {
            updateCurrentUser(data: $data) {
                data {
                    id
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
