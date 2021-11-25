import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        id
        name
        description
        parent
        settings {
            domains {
                fqdn
            }
        }
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

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
