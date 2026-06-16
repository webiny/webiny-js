import {
    ApiGatewayManagementApiClient,
    DeleteConnectionCommand,
    PostToConnectionCommand
} from "@webiny/aws-sdk/client-apigatewaymanagementapi/index.js";
import { WebsocketsTransport } from "@webiny/api-websockets";
import type { GenericRecord } from "@webiny/api/types.js";

class AwsWebsocketsTransportImpl implements WebsocketsTransport.Interface {
    private readonly clients = new Map<string, ApiGatewayManagementApiClient>();

    public async send<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsTransport.SendConnection[],
        data: WebsocketsTransport.SendData<T>
    ): Promise<void> {
        for (const connection of connections) {
            try {
                const client = this.getClient(connection.endpoint);

                const command = new PostToConnectionCommand({
                    ConnectionId: connection.connectionId,
                    Data: JSON.stringify(data)
                });
                await client.send(command);
            } catch (ex) {
                console.error(
                    `Failed to send message to connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    public async disconnect(connections: WebsocketsTransport.DisconnectConnection[]) {
        for (const connection of connections) {
            try {
                const client = this.getClient(connection.endpoint);
                const command = new DeleteConnectionCommand({
                    ConnectionId: connection.connectionId
                });
                await client.send(command);
            } catch (ex) {
                console.error(
                    `Failed to disconnect connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    private getClient(endpoint: string): ApiGatewayManagementApiClient {
        const client = this.clients.get(endpoint);
        if (client) {
            return client;
        }
        const newClient = new ApiGatewayManagementApiClient({
            endpoint
        });
        this.clients.set(endpoint, newClient);
        return newClient;
    }
}

export const AwsWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: AwsWebsocketsTransportImpl,
    dependencies: []
});

