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

// personalAccessTokens {
//     id
//     name
//     token
// }

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
                meta {
                    cursors {
                        next
                        previous
                    }
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
            }
        }
    }
`;

export const READ_USER: any = gql`
    query getUser($login: ID!) {
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
    mutation createUser($data: SecurityUserInput!){
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
    mutation updateUser($login: ID!, $data: SecurityUserInput!){
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
    mutation deleteUser($login: ID!) {
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
