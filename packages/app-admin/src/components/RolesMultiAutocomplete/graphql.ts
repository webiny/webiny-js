export const LIST_ROLES = /* GraphQL */ `
    query ListRoles {
        security {
            roles: listRoles {
                data {
                    id
                    slug
                    name
                    description
                    createdOn
                }
                error {
                    data
                    message
                    code
                }
            }
        }
    }
`;
