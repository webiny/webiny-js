import gql from "graphql-tag";

export interface IRole {
    id: string;
    slug: string;
    name: string;
    description: string;
    createdOn: string;
}

export interface IListRolesResponse {
    security: {
        roles: {
            data: IRole[];
        };
    };
}

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
            }
        }
    }
`;
