// @flow
import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    roles { id name }
`;

export const LIST_GROUPS = gql`
    query listGroups(
        $where: JSON
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: SecurityGroupSearchInput
    ) {
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

export const READ_GROUP = gql`
    query getGroup($id: ID!) {
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

export const CREATE_GROUP = gql`
    mutation createGroup($data: SecurityGroupInput!){
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

export const UPDATE_GROUP = gql`
    mutation updateGroup($id: ID!, $data: SecurityGroupInput!){
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

export const DELETE_GROUP = gql`
    mutation deleteGroup($id: ID!) {
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
