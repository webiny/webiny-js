import { IWebsocketsConnectionRegistryData } from "~/registry";
import { IWebsocketsResponseError } from "~/runner";

export interface IListConnectionsVariables {
    where?: {
        identityId?: string;
        tenant?: string;
        locale?: string;
    };
}

export interface IListConnectionsResponse {
    data: {
        websockets: {
            listConnections: {
                data?: IWebsocketsConnectionRegistryData;
                error?: IWebsocketsResponseError;
            };
        };
    };
}

export const LIST_CONNECTIONS = /* GraphQL */ `
    query ListConnections($where: WebsocketsListConnectionsWhereInput) {
        websockets {
            listConnections(where: $where) {
                data {
                    connectionId
                    domainName
                    stage
                    identity {
                        id
                        type
                        displayName
                    }
                    connectedOn
                    tenant
                    locale
                }
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export interface IDisconnectIdentityConnectionsVariables {
    identityId: string;
}

export const DISCONNECT_IDENTITY_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectIdentityConnections($identityId: String!) {
        websockets {
            disconnectIdentity(identityId: $identityId) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export interface IDisconnectTenantConnectionsVariables {
    tenant: string;
    locale?: string;
}

export interface IDisconnectConnectionsResponse {
    data: {
        websockets: {
            disconnectConnection: {
                data?: boolean;
                error?: IWebsocketsResponseError;
            };
        };
    };
}

export const DISCONNECT_TENANT_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectIdentityConnections($tenant: String!, $locale: String) {
        websockets {
            disconnectTenant(tenant: $tenant, locale: $locale) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;

export const DISCONNECT_ALL_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectAllConnections {
        websockets {
            disconnectAll {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
