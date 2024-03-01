import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { WebsocketsContext } from "~/context/WebsocketsContext";
import { WebsocketsConnectionRegistry } from "~/registry";
import { MockWebsocketsTransport } from "~tests/mocks/MockWebsocketsTransport";

interface IMockData {
    mockData?: boolean;
}

describe("websockets context", () => {
    it("should properly list connections", async () => {
        const documentClient = getDocumentClient();
        const registry = new WebsocketsConnectionRegistry(documentClient);
        const transport = new MockWebsocketsTransport();

        const context = new WebsocketsContext(registry, transport);
        expect(context).toBeInstanceOf(WebsocketsContext);

        const resultNoConnections = await context.listConnections({
            where: {
                identityId: "id-1"
            }
        });
        expect(resultNoConnections).toEqual([]);

        await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1",
                displayName: "John Doe",
                type: "admin"
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: new Date().toISOString()
        });

        const resultWithConnections = await context.listConnections({
            where: {
                identityId: "id-1"
            }
        });
        expect(resultWithConnections).toEqual([
            {
                connectionId: "connection-1",
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1",
                    displayName: "John Doe",
                    type: "admin"
                },
                domainName: "https://webiny.com",
                stage: "dev",
                connectedOn: expect.any(String)
            }
        ]);
    });

    it("should properly send a message via transport", async () => {
        const documentClient = getDocumentClient();
        const registry = new WebsocketsConnectionRegistry(documentClient);
        const transport = new MockWebsocketsTransport();

        const context = new WebsocketsContext(registry, transport);

        await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1",
                displayName: "John Doe",
                type: "admin"
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: new Date().toISOString()
        });

        await context.send<IMockData>(
            {
                id: "id-1",
                displayName: "John Doe",
                type: "admin"
            },
            {
                data: {
                    mockData: true
                }
            }
        );

        expect(transport.messages.size).toBe(1);
        expect(transport.messages.get("connection-1")).toEqual({
            data: {
                mockData: true
            }
        });
    });
});
