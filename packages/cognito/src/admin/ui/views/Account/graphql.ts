import gql from "graphql-tag";

const currentUserFields = /* GraphQL */ `
    {
        id
        email
        firstName
        lastName
        avatar
        external
    }
`;

export const GET_CURRENT_USER = gql`
    query GetCurrentUser {
        adminUsers {
            user: getCurrentUser {
                data ${currentUserFields}
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
                data ${currentUserFields}
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
