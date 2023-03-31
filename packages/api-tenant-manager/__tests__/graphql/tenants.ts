const fields = /* GraphQL */ `
    id
    name
    description
    tags
    parent
    settings {
        domains {
            fqdn
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

export const CREATE_TENANT = /* GraphQL */ `
    mutation CreateTenant($data: CreateTenantInput!) {
        tenancy {
            createTenant(data: $data) {
                data {
                    ${fields}
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_TENANTS = /* GraphQL */ `
    query ListTenants {
        tenancy {
            listTenants {
                data {
                    ${fields}
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_TENANT = /* GraphQL */ `
    query GetTenant($id: ID!) {
        tenancy {
            getTenant(id: $id) {
                data {
                    ${fields}
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_TENANT = /* GraphQL */ `
    mutation UpdateTenant($id: ID!, $data: UpdateTenantInput!) {
        tenancy {
            updateTenant(id: $id, data: $data) {
                data {
                    ${fields}
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_TENANT = /* GraphQL */ `
    mutation DeleteTenant($id: ID!) {
        tenancy {
            deleteTenant(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL_SECURITY = /* GraphQL */ `
    mutation Install {
        security {
            install {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL_TENANCY = /* GraphQL */ `
    mutation InstallTenancy {
        tenancy {
            install {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
