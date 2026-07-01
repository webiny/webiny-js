const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export const LIST_USERS = /* GraphQL */ `
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
