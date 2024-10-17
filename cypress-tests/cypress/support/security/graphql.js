import { gql } from "graphql-request";

const BASE_FIELDS = `
    id
    email
    firstName
    lastName
    avatar
    gravatar
    groups {
        id
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
    mutation CreateUser($data: AdminUsersCreateInput!){
        adminUsers {
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
    mutation DeleteUser($id: ID!) {
        adminUsers {
            user: deleteUser(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const LIST_USERS = gql`
    query ListUsers {
        adminUsers {
            users: listUsers {
                data {
                    ${BASE_FIELDS}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const GROUP_BASE_FIELDS = `
    id
    name
    slug
    description
    permissions
    createdOn
`;

export const READ_GROUP = gql`
    query getGroup($slug: String!) {
        security {
            group: getGroup(where: { slug: $slug }){
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
    mutation deleteGroup($id: ID!) {
        security {
            group: deleteGroup(id: $id) {
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
