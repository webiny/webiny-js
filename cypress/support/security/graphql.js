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
