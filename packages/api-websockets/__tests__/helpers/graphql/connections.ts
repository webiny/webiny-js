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
