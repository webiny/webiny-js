import gql from "graphql-tag";

export const LIST_ROLES = gql`
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
