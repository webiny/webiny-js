import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { WebsocketsContext } from "~/context/WebsocketsContext";
import { WebsocketsConnectionRegistry } from "~/registry";
import { WebsocketsTransporter } from "~/transporter";
import { MockWebsocketsTransporter } from "~tests/mocks/MockWebsocketsTransporter";

describe("websockets context", () => {
    it("should properly list connections", async () => {
        const documentClient = getDocumentClient();
        const registry = new WebsocketsConnectionRegistry(documentClient);
        const transporter = new WebsocketsTransporter();

        const context = new WebsocketsContext(registry, transporter);
        expect(context).toBeInstanceOf(WebsocketsContext);

        const resultNoConnections = await context.listConnections({
            id: "id-1"
        });
        expect(resultNoConnections).toEqual([]);

        await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1"
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: new Date().toISOString()
        });

        const resultWithConnections = await context.listConnections({
            id: "id-1"
        });
        expect(resultWithConnections).toEqual([
            {
                connectionId: "connection-1",
                tenant: "root",
                locale: "en-US",
                identity: {
                    id: "id-1"
                },
                domainName: "https://webiny.com",
                stage: "dev",
                connectedOn: expect.any(String)
            }
        ]);
    });

    it("should properly send a message via transporter", async () => {
        const documentClient = getDocumentClient();
        const registry = new WebsocketsConnectionRegistry(documentClient);
        const transporter = new MockWebsocketsTransporter();

        const context = new WebsocketsContext(registry, transporter);

        await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1"
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: new Date().toISOString()
        });

        await context.send(
            {
                id: "id-1"
            },
            {
                mockData: true
            }
        );

        expect(transporter.messages.size).toBe(1);
        expect(transporter.messages.get("connection-1")).toEqual({
            mockData: true
        });
    });
});
