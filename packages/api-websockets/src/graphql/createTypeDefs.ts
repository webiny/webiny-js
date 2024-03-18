export const createTypeDefs = () => {
    return /* GraphQL */ `
        type WebsocketsIdentity {
            id: String!
            type: String
            displayName: String
        }
        type WebsocketsConnection {
            connectionId: String!
            domainName: String!
            stage: String!
            identity: WebsocketsIdentity!
            connectedOn: DateTime!
            tenant: String!
            locale: String!
        }

        type WebsocketsError {
            message: String!
            code: String!
            data: JSON
        }

        type WebsocketsListConnectionsResponse {
            data: [WebsocketsConnection!]
            error: WebsocketsError
        }

        input WebsocketsListConnectionsWhereInput {
            identityId: String
            tenant: String
            locale: String
        }

        type WebsocketsDisconnectResponse {
            data: [WebsocketsConnection!]
            error: WebsocketsError
        }

        type WebsocketsQuery {
            _empty: String
        }

        type WebsocketsMutation {
            _empty: String
        }

        extend type Query {
            websockets: WebsocketsQuery
        }

        extend type Mutation {
            websockets: WebsocketsMutation
        }

        extend type WebsocketsQuery {
            listConnections(
                where: WebsocketsListConnectionsWhereInput
            ): WebsocketsListConnectionsResponse!
        }

        extend type WebsocketsMutation {
            disconnect(connections: [String!]!): WebsocketsDisconnectResponse!
            disconnectIdentity(identityId: String!): WebsocketsDisconnectResponse!
            disconnectTenant(tenant: String!, locale: String): WebsocketsDisconnectResponse!
            disconnectAll: WebsocketsDisconnectResponse!
        }
    `;
};
