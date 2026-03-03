import gql from "graphql-tag";
import type {User, IAuditLogsError} from "~/types.js";

const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export interface IListUsersResponse {
    adminUsers: {
        users: {
            data: User[] | null;
            error: IAuditLogsError | null;
        }
    };
}

export const LIST_USERS = gql`
    query ListUsers {
        adminUsers {
            users: listUsers {
                data {
                    id
                    firstName
                    lastName
                    roles {
                        name
                    }
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;
