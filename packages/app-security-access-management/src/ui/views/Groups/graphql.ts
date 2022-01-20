import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    permissions
    system
    createdOn
`;

export const LIST_GROUPS: any = gql`
    query listGroups {
        security {
            groups: listGroups {
                data {
                    ${fields}
                }
            }
        }
    }
`;

export const READ_GROUP: any = gql`
    query getGroup($id: ID!) {
        security {
            group: getGroup(where: { id: $id }){
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
    mutation createGroup($data: SecurityGroupCreateInput!){
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
    mutation updateGroup($id: ID!, $data: SecurityGroupUpdateInput!){
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
