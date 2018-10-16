// @flow
import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    roles { id name }
`;

export const loadGroups = gql`
    query LoadGroups($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        security {
            groups: listGroups(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                    description
                    createdOn
                }
                meta {
                    count
                    totalCount
                    totalPages
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const loadGroup = gql`
    query LoadGroup($id: ID!) {
        security {
            group: getGroup(id: $id){
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

export const createGroup = gql`
    mutation CreateGroup($data: GroupInput!){
        security {
            group: createGroup(data: $data) {
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

export const updateGroup = gql`
    mutation UpdateGroup($id: ID!, $data: GroupInput!){
        security {
            group: updateGroup(id: $id, data: $data) {
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

export const deleteGroup = gql`
    mutation DeleteGroup($id: ID!) {
        security {
            deleteGroup(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
