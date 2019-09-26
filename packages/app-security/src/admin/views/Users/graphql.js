// @flow
import gql from "graphql-tag";

const fields = `
    id email firstName lastName fullName avatar { id src } enabled groups { id name } roles { id name }
`;

export const LIST_USERS = gql`
    query listUsers(
        $where: JSON
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: SecurityUserSearchInput
    ) {
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

export const READ_USER = gql`
    query getUser($id: ID!) {
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

export const CREATE_USER = gql`
    mutation createUser($data: SecurityUserInput!){
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

export const UPDATE_USER = gql`
    mutation updateUser($id: ID!, $data: SecurityUserInput!){
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

export const DELETE_USER = gql`
    mutation deleteUser($id: ID!) {
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
