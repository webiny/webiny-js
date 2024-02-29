import {
    ApiGatewayManagementApiClient,
    PostToConnectionCommand
} from "@webiny/aws-sdk/client-apigatewaymanagementapi";
import {
    IWebsocketsTransporter,
    IWebsocketsTransporterSendConnection,
    IWebsocketsTransporterSendData
} from "./abstractions/IWebsocketsTransporter";

export class WebsocketsTransporter implements IWebsocketsTransporter {
    private readonly clients = new Map<string, ApiGatewayManagementApiClient>();

    public async send<T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData>(
        connections: IWebsocketsTransporterSendConnection[],
        data: T
    ): Promise<void> {
        for (const connection of connections) {
            try {
                const client = this.getClient(connection);

                const command = new PostToConnectionCommand({
                    ConnectionId: connection.connectionId,
                    Data: JSON.stringify(data)
                });
                await client.send(command);
            } catch (ex) {
                console.log(
                    `Failed to send message to connection "${connection.connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    private getClient(
        connection: IWebsocketsTransporterSendConnection
    ): ApiGatewayManagementApiClient {
        const endpoint = `https://${connection.domainName}/${connection.stage}`;
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
