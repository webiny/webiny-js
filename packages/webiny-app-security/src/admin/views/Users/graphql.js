// @flow
import gql from "graphql-tag";

const fields = `
    id email firstName lastName fullName avatar { id src } enabled groups { id name } roles { id name }
`;

export const loadUsers = gql`
    query LoadUsers($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SecurityUserSearchInput) {
        security {
            users: listUsers(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    email
                    firstName
                    lastName
                    fullName
                    avatar {
                        id
                        src
                    }
                    createdOn
                }
                meta {
                    totalCount
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const loadUser = gql`
    query LoadUser($id: ID!) {
        security {
            user: getUser(id: $id){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const createUser = gql`
    mutation CreateUser($data: UserInput!){
        security {
            user: createUser(data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const updateUser = gql`
    mutation UpdateUser($id: ID!, $data: UserInput!){
        security {
            user: updateUser(id: $id, data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const deleteUser = gql`
    mutation DeleteUser($id: ID!) {
        security {
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
