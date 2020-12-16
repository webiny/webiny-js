import gql from "graphql-tag";

const fields = `
    id
    name
    description
    createdFrom {
        id
        name
    }
    slug
`;

export const LIST_ENVIRONMENTS = gql`
    query ListEnvironments {
        cms {
            environments: listEnvironments {
                data {
                    id
                    name
                    isProduction
                    createdOn
                    aliases {
                        id
                        name
                    }
                }
            }
        }
    }
`;

export const READ_ENVIRONMENT = gql`
    query GetEnvironment($id: ID!) {
        cms {
            environment: getEnvironment(id: $id){
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

export const CREATE_ENVIRONMENT = gql`
    mutation CreateEnvironment($data: CmsEnvironmentInput!){
        cms {
            environment: createEnvironment(data: $data) {
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

export const UPDATE_ENVIRONMENT = gql`
    mutation UpdateEnvironment($id: ID!, $data: CmsEnvironmentInput!){
        cms {
            environment: updateEnvironment(id: $id, data: $data) {
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

export const DELETE_ENVIRONMENT = gql`
    mutation DeleteEnvironment($id: ID!) {
        cms {
            deleteEnvironment(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
