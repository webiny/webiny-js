const DATA_FIELD = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        avatar
        gravatar
        groups {
            id
            slug
            name
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
                data  {
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
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_USER = /* GraphQL */ `
    mutation CreateUser($data: AdminUsersCreateInput!) {
        adminUsers {
            createUser(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_USER = /* GraphQL */ `
    mutation UpdateUser($id: ID!, $data: AdminUsersUpdateInput!) {
        adminUsers {
            updateUser(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_USER = /* GraphQL */ `
    mutation DeleteUser($id: ID!) {
        adminUsers {
            deleteUser(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_USERS = /* GraphQL */ `
    query ListUser {
        adminUsers {
            listUsers {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_USER = /* GraphQL */ `
    query GetUser($id: ID, $email: String) {
        adminUsers {
            getUser(where: { id: $id, email: $email }) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_CURRENT_USER = /* GraphQL */ `
    query GetCurrentUser {
        adminUsers {
            getCurrentUser {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_CURRENT_USER = /* GraphQL */ `
    mutation UpdateCurrentUser($data: AdminUsersCurrentUserInput!) {
        adminUsers {
            updateCurrentUser(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_GROUP = /* GraphQL */ `
    query GetGroup($id: ID, $slug: String) {
        security {
            getGroup(where: { id: $id, slug: $slug }) {
                data {
                    id
                    name
                    slug
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
