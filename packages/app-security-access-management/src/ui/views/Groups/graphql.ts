import gql from "graphql-tag";
import { Group } from "~/types";

const fields = `
    id
    name
    slug
    description
    permissions
    system
    plugin
    createdOn
`;

export interface ListGroupsResponse {
    security: {
        groups: {
            data: Group[];
        };
    };
}

export const LIST_GROUPS = gql`
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

export const READ_GROUP = gql`
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

export const CREATE_GROUP = gql`
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

export const UPDATE_GROUP = gql`
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

export const DELETE_GROUP = gql`
    mutation deleteGroup($id: ID!) {
        security {
            deleteGroup(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
