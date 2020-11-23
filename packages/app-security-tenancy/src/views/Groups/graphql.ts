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
    query getGroup($slug: ID!) {
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
    mutation updateGroup($slug: ID!, $data: SecurityGroupInput!){
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
    mutation deleteGroup($slug: ID!) {
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
