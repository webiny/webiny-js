import gql from "graphql-tag";
import type { UserItem } from "~/admin/ui/UserItem.js";

const listUserFields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        avatar
        createdOn
        external
    }
`;

const userFormFields = () => {
    return /* GraphQL */ `
        {
            id
            email
            firstName
            lastName
            avatar
            external
            roles {
                id
                slug
                name
            }
            teams {
                id
                slug
                name
            }
        }
    `;
};

export interface IListUsersResponse {
    adminUsers: {
        users: {
            data: UserItem[] | null;
            error: Error | null;
        };
    };
}

export const LIST_USERS = gql`
    query ListUsers {
        adminUsers {
            users: listUsers {
                data ${listUserFields}
            }
        }
    }
`;

export interface IReadUserResponse {
    adminUsers: {
        user: {
            data: UserItem | null;
            error: Error | null;
        };
    };
}

export const READ_USER = () => gql`
    query GetUser($id: ID!) {
        adminUsers {
            user: getUser(where: { id: $id }){
                data ${userFormFields()}
                error {
                    code
                    message
                }
            }
        }
    }
`;

export interface ICreateUserResponse {
    adminUsers: {
        user: {
            data: UserItem | null;
            error: Error | null;
        };
    };
}

export const CREATE_USER = () => {
    return gql`
        mutation CreateUser($data: AdminUsersCreateInput!){
            adminUsers {
                user: createUser(data: $data) {
                    data ${listUserFields}
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};

export interface IUpdateUserResponse {
    adminUsers: {
        user: {
            data: UserItem | null;
            error: Error | null;
        };
    };
}

export const UPDATE_USER = () => gql`
    mutation UpdateUser($id: ID!, $data: AdminUsersUpdateInput!){
        adminUsers {
            user: updateUser(id: $id, data: $data) {
                data ${userFormFields()}
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export interface IDeleteUserResponse {
    adminUsers: {
        deleteUser: {
            data: boolean;
            error: Error | null;
        };
    };
}

export const DELETE_USER = gql`
    mutation DeleteUser($id: ID!) {
        adminUsers {
            deleteUser(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
