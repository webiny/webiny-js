import gql from "graphql-tag";
import { TenantItem } from "~/types";

const fields = /* GraphQL */ `
    {
        id
        name
        description
        tags
        parent
    }
`;

export interface TenantErrorResponse {
    code: string;
    message: string;
    data: Record<string, any>;
}
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        message
        data
    }
`;
/**
 * ###################
 */
interface CreateTenantInputSettingsDomain {
    fqdn: string;
}
interface CreateTenantInputSettings {
    domains: CreateTenantInputSettingsDomain[];
}
interface CreateTenantInput {
    name: string;
    description: string;
    tags: string[];
    settings: CreateTenantInputSettings;
}
export interface CreateTenantMutationResponse {
    data: TenantItem;
}
export interface CreateTenantMutationVariables {
    data: CreateTenantInput;
}
export const CREATE_TENANT = gql`
    mutation CreateTenant($data: CreateTenantInput!) {
        tenancy {
            tenant: createTenant(data: $data) {
                data ${fields}
                error ${ERROR_FIELD}
            }
        }
    }
`;
/**
 * ####################
 */
export interface ListTenantsQueryResponse {
    tenancy: {
        listTenants: {
            data: TenantItem[];
            error: TenantErrorResponse | null;
        };
    };
}
export const LIST_TENANTS = gql`
    query ListTenants {
        tenancy {
            listTenants {
                data ${fields}
                error ${ERROR_FIELD}
            }
        }
    }
`;
/**
 * ##################
 */
export interface GetTenantQueryResponse {
    tenancy: {
        getTenant: {
            data: TenantItem;
            error: TenantErrorResponse | null;
        };
    };
}
export interface GetTenantQueryVariables {
    id: string;
}
export const GET_TENANT = gql`
    query GetTenant($id: ID!) {
        tenancy {
            getTenant(where: { id: $id }) {
                data ${fields}
                error ${ERROR_FIELD}
            }
        }
    }
`;

/**
 * ###################
 */
interface UpdateTenantInputSettingsDomain {
    fqdn: string;
}
interface UpdateTenantInputSettings {
    domains: UpdateTenantInputSettingsDomain[];
}
interface UpdateTenantInput {
    name: string;
    description: string;
    settings: UpdateTenantInputSettings;
}
export interface UpdateTenantMutationResponse {
    data: TenantItem;
}
export interface UpdateTenantMutationVariables {
    id: string;
    data: UpdateTenantInput;
}
export const UPDATE_TENANT = gql`
    mutation UpdateTenant($id: ID!, $data: UpdateTenantInput!) {
        tenancy {
            tenant: updateTenant(id: $id, data: $data) {
                data ${fields}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_TENANT = gql`
    mutation DeleteTenant($id: ID!) {
        tenancy {
            deleteTenant(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
