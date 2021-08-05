import gql from "graphql-tag";

const fields = /* GraphQL */ `
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
        createdOn
    }
`;

export const LIST_USERS: any = gql`
    query ListUsers {
        security {
            users: listUsers {
                data {
                    login
                    firstName
                    lastName
                    avatar
                    gravatar
                    createdOn
                }
            }
        }
    }
`;

export const READ_USER: any = gql`
    query GetUser($login: String!) {
        security {
            user: getUser(login: $login){
                data ${fields}
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const CREATE_USER: any = gql`
    mutation CreateUser($data: SecurityUserCreateInput!){
        security {
            user: createUser(data: $data) {
                data ${fields}
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
    mutation UpdateUser($login: String!, $data: SecurityUserUpdateInput!){
        security {
            user: updateUser(login: $login, data: $data) {
                data ${fields}
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
    mutation DeleteUser($login: String!) {
        security {
            deleteUser(login: $login) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
