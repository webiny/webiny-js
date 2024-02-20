import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { SocketsContext } from "~/context/SocketsContext";
import { SocketsConnectionRegistry } from "~/registry";
import { SocketsTransporter } from "~/transporter";
import { MockSocketsTransporter } from "~tests/mocks/MockSocketsTransporter";

describe("sockets context", () => {
    it("should properly list connections", async () => {
        const documentClient = getDocumentClient();
        const registry = new SocketsConnectionRegistry(documentClient);
        const transporter = new SocketsTransporter();

        const context = new SocketsContext(registry, transporter);
        expect(context).toBeInstanceOf(SocketsContext);

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
        const registry = new SocketsConnectionRegistry(documentClient);
        const transporter = new MockSocketsTransporter();

        const context = new SocketsContext(registry, transporter);

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
