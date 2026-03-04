import gql from "graphql-tag";
import type {UserItem} from "~/admin/ui/UserItem.js";

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

export interface IGetCurrentUserResponse {
    adminUsers: {
        user: {
            data: UserItem | null;
            error: Error | null;
        };
    };
}

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

export interface IUpdateCurrentUserResponse {
    adminUsers: {
        updateCurrentUser: {
            data: UserItem | null;
            error: Error | null;
        };
    };
}

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
