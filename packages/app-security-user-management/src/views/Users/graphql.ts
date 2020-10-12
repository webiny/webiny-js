import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        fullName
        avatar {
            id
            src
        }
        groups {
            id
            name
        }
        personalAccessTokens {
            id
            name
            token
        }
    }
`;

export const LIST_USERS: any = gql`
    query listUsers(
        $where: JSON
        $sort: JSON
        $limit: Int
        $after: String
        $before: String
        $search: SecurityUserSearchInput
    ) {
        security {
            users: listUsers(
                where: $where
                sort: $sort
                limit: $limit
                after: $after
                before: $before
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
    query getUser($id: ID!) {
        security {
            user: getUser(id: $id){
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
    mutation updateUser($id: ID!, $data: SecurityUserInput!){
        security {
            user: updateUser(id: $id, data: $data) {
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
