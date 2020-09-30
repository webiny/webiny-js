import gql from "graphql-tag";

const fields = `
    id
    name
    description
    token
    scopes
    environments {
        id
        name
    }
`;

export const LIST_ACCESS_TOKENS = gql`
    {
        cms {
            listAccessTokens {
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

export const GET_ACCESS_TOKEN = gql`
    query getAccessToken($id: ID!) {
        cms {
            getAccessToken(id: $id) {
                data {
                    ${fields}
                }
            }
        }
    }
`;

export const CREATE_ACCESS_TOKEN = gql`
    mutation createAccessToken($data: CmsAccessTokenCreateInput!) {
        cms {
            createAccessToken(data: $data) {
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
export const UPDATE_ACCESS_TOKEN = gql`
    mutation updateAccessToken($id: ID!, $data: CmsAccessTokenUpdateInput!) {
        cms {
            updateAccessToken(id: $id, data: $data) {
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
export const DELETE_ACCESS_TOKEN = gql`
    mutation deleteAccessToken($id: ID!) {
        cms {
            deleteAccessToken(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
