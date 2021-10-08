import gql from "graphql-tag";

const fields = `
    name
    slug
    description
    permissions
    createdOn
`;

export const LIST_GROUPS: any = gql`
    query listGroups {
        security {
            groups: listGroups {
                data {
                    slug
                    name
                    description
                    createdOn
                }
            }
        }
    }
`;

export const READ_GROUP: any = gql`
    query getGroup($slug: String!) {
        security {
            group: getGroup(slug: $slug){
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
    mutation updateGroup($slug: String!, $data: SecurityGroupUpdateInput!){
        security {
            group: updateGroup(slug: $slug, data: $data) {
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
    mutation deleteGroup($slug: String!) {
        security {
            deleteGroup(slug: $slug) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
