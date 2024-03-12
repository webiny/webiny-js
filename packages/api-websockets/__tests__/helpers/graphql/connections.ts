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

/**
 * Disconnect all connections for a given identity.
 */
export interface IDisconnectIdentityConnectionsVariables {
    identityId: string;
}

export interface IDisconnectIdentityConnectionsResponse {
    data: {
        websockets: {
            disconnectIdentity: {
                data?: IWebsocketsConnectionRegistryData[];
                error?: IWebsocketsResponseError;
            };
        };
    };
}

export const DISCONNECT_IDENTITY_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectIdentityConnections($identityId: String!) {
        websockets {
            disconnectIdentity(identityId: $identityId) {
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

/**
 * Disconnect all connections for a given tenant / locale.
 */
export interface IDisconnectTenantConnectionsVariables {
    tenant: string;
    locale?: string;
}

export interface IDisconnectTenantConnectionsResponse {
    data: {
        websockets: {
            disconnectTenant: {
                data?: IWebsocketsConnectionRegistryData[];
                error?: IWebsocketsResponseError;
            };
        };
    };
}

export const DISCONNECT_TENANT_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectIdentityConnections($tenant: String!, $locale: String) {
        websockets {
            disconnectTenant(tenant: $tenant, locale: $locale) {
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

/**
 * Disconnect a single connection.
 */
export interface IDisconnectConnectionVariables {
    connections: string[];
}

export interface IDisconnectConnectionResponse {
    data: {
        websockets: {
            disconnect: {
                data?: IWebsocketsConnectionRegistryData[];
                error?: IWebsocketsResponseError;
            };
        };
    };
}

export const DISCONNECT_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectConnections($connections: [String!]!) {
        websockets {
            disconnect(connections: $connections) {
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

/**
 * Disconnect all connections.
 */

export interface IDisconnectAllConnectionsResponse {
    data: {
        websockets: {
            disconnectAll: {
                data?: IWebsocketsConnectionRegistryData[];
                error?: IWebsocketsResponseError;
            };
        };
    };
}

export const DISCONNECT_ALL_CONNECTIONS = /* GraphQL */ `
    mutation DisconnectAllConnections {
        websockets {
            disconnectAll {
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
