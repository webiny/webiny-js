import { gql } from "graphql-request";

const BASE_FIELDS = `
    login
    firstName
    lastName
    avatar
    gravatar
    group {
        slug
        name
    }
    createdOn
`;

const ERROR_FIELDS = `
    code
    message
    data
`;

export const CREATE_USER = gql`
    mutation CreateUser($data: SecurityUserCreateInput!){
        security {
            user: createUser(data: $data) {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_USER = gql`
    mutation DeleteUser($login: String!) {
        security {
            user: deleteUser(login: $login) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const GROUP_BASE_FIELDS = `
    name
    slug
    description
    permissions
    createdOn
`;

export const READ_GROUP = gql`
    query getGroup($slug: String!) {
        security {
            group: getGroup(slug: $slug){
                data {
                    ${GROUP_BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
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
                    ${GROUP_BASE_FIELDS}
                }
                error {
                   ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_GROUP = gql`
    mutation deleteGroup($slug: String!) {
        security {
            group: deleteGroup(slug: $slug) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

const API_KEY_BASE_FIELDS = `
    id
    name
    description
    token
    permissions
    createdOn
`;

export const READ_API_KEY = gql`
    query GetApiKey($id: ID!) {
        security {
            apiKey: getApiKey(id: $id){
                data {
                    ${API_KEY_BASE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const CREATE_API_KEY = gql`
    mutation CreateApiKey($data: SecurityApiKeyInput!){
        security {
            apiKey: createApiKey(data: $data) {
                data {
                    ${API_KEY_BASE_FIELDS}
                }
                error {
                     ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_API_KEY = gql`
    mutation DeleteApiKey($id: ID!) {
        security {
            apiKey: deleteApiKey(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
