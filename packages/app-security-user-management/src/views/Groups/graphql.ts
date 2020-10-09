import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    permissions
`;

export const LIST_GROUPS: any = gql`
    query listGroups(
        $where: JSON
        $sort: JSON
        $search: SecurityGroupSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        security {
            groups: listGroups(
                where: $where
                sort: $sort
                search: $search
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    name
                    description
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

export const READ_GROUP: any = gql`
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

export const CREATE_GROUP: any = gql`
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

export const UPDATE_GROUP: any = gql`
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

export const DELETE_GROUP: any = gql`
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
