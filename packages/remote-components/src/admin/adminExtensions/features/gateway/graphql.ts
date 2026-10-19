const FIELDS = /* GraphQL */ `
    id
    kind
    name
    label
    description
    enabled
    runtimeVersion
    source
    config
    compiled
    savedOn
`;

const ERROR = /* GraphQL */ `
    error {
        code
        message
    }
`;

export const LIST_ENABLED_ADMIN_EXTENSIONS = /* GraphQL */ `
    query ListEnabledAdminExtensions($kind: AdminExtensionKind!) {
        adminExtensions {
            listEnabledAdminExtensions(kind: $kind) {
                data { ${FIELDS} }
                ${ERROR}
            }
        }
    }
`;

export const LIST_ADMIN_EXTENSIONS = /* GraphQL */ `
    query ListAdminExtensions {
        adminExtensions {
            listAdminExtensions {
                data { ${FIELDS} }
                ${ERROR}
            }
        }
    }
`;

export const SET_ADMIN_EXTENSION_ENABLED = /* GraphQL */ `
    mutation SetAdminExtensionEnabled($id: ID!, $enabled: Boolean!) {
        adminExtensions {
            setAdminExtensionEnabled(id: $id, enabled: $enabled) {
                data { ${FIELDS} }
                ${ERROR}
            }
        }
    }
`;

export const DELETE_ADMIN_EXTENSION = /* GraphQL */ `
    mutation DeleteAdminExtension($id: ID!) {
        adminExtensions {
            deleteAdminExtension(id: $id) {
                data
                ${ERROR}
            }
        }
    }
`;
