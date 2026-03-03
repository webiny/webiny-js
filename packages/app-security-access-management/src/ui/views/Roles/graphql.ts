import gql from "graphql-tag";
import type { Role } from "~/types.js";

const fields = `
    id
    name
    slug
    description
    permissions
    system
    plugin
    createdOn
`;

export interface ListRolesResponse {
    security: {
        roles: {
            data: Role[];
        };
    };
}

export const LIST_ROLES = gql`
    query listRoles {
        security {
            roles: listRoles {
                data {
                    ${fields}
                }
            }
        }
    }
`;

export interface IReadRoleResponse {
    security: {
        role: {
            data: Role | null;
            error: Error | null;
        };
    };
}

export const READ_ROLE = gql`
    query getRole($id: ID!) {
        security {
            role: getRole(where: { id: $id }){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export interface ICreateRoleResponse {
    security: {
        role: {
            data: Role | null;
            error: Error | null;
        };
    };
}

export const CREATE_ROLE = gql`
    mutation createRole($data: SecurityRoleCreateInput!){
        security {
            role: createRole(data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export interface IUpdateRoleResponse {
    security: {
        role: {
            data: Role | null;
            error: Error | null;
        };
    };
}

export const UPDATE_ROLE = gql`
    mutation updateRole($id: ID!, $data: SecurityRoleUpdateInput!){
        security {
            role: updateRole(id: $id, data: $data) {
                data {
                    ${fields}
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export interface IDeleteRoleResponse {
    security: {
        deleteRole: {
            data: boolean;
            error: Error | null;
        };
    };
}

export const DELETE_ROLE = gql`
    mutation deleteRole($id: ID!) {
        security {
            deleteRole(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
