import gql from "graphql-tag";

const fields = `
    id
    name
    description
    token
    permissions
    createdOn
`;

export const LIST_API_KEYS: any = gql`
    query ListApiKeys {
        security {
            apiKeys: listApiKeys {
                data {
                   ${fields}
                }
            }
        }
    }
`;

export const READ_API_KEY: any = gql`
    query GetApiKey($id: ID!) {
        security {
            apiKey: getApiKey(id: $id){
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

export const CREATE_API_KEY: any = gql`
    mutation CreateApiKey($data: SecurityApiKeyInput!){
        security {
            apiKey: createApiKey(data: $data) {
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

export const UPDATE_API_KEY: any = gql`
    mutation UpdateApiKey($id: ID!, $data: SecurityApiKeyInput!){
        security {
            apiKey: updateApiKey(id: $id, data: $data) {
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

export const DELETE_API_KEY: any = gql`
    mutation DeleteApiKey($id: ID!) {
        security {
            deleteApiKey(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
