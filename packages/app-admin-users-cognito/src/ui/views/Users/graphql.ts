import gql from "graphql-tag";

const listUserFields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        avatar
        gravatar
        createdOn
    }
`;

const userFormFields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        avatar
        group {
            id
            slug
            name
        }
        team {
            id
            slug
            name
        }
    }
`;

export const LIST_USERS: any = gql`
    query ListUsers {
        adminUsers {
            users: listUsers {
                data ${listUserFields}
            }
        }
    }
`;

export const READ_USER: any = gql`
    query GetUser($id: ID!) {
        adminUsers {
            user: getUser(where: { id: $id }){
                data ${userFormFields}
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const CREATE_USER: any = gql`
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

export const UPDATE_USER: any = gql`
    mutation UpdateUser($id: ID!, $data: AdminUsersUpdateInput!){
        adminUsers {
            user: updateUser(id: $id, data: $data) {
                data ${userFormFields}
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const DELETE_USER: any = gql`
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
