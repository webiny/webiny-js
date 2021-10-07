import gql from "graphql-tag";

export const GET_CURRENT_USER = gql`
    query GetCurrentUser {
        adminUsers {
            user: getCurrentUser {
                data {
                    email
                    firstName
                    lastName
                    avatar
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const UPDATE_CURRENT_USER = gql`
    mutation UpdateCurrentUser($data: AdminUsersCurrentUserInput!) {
        adminUsers {
            updateCurrentUser(data: $data) {
                data {
                    email
                    avatar
                }
            }
        }
    }
`;
