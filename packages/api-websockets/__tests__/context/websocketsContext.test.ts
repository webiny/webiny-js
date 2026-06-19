import { describe, it, expect } from "vitest";
import { useHandler } from "~tests/helpers/useHandler";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";
import { WebsocketsSendToIdentityUseCase } from "~/features/SendToIdentity/abstractions.js";

describe("websockets context", () => {
    it("should properly list connections", async () => {
        const { handle } = useHandler();
        const ctx = await handle();
        const registry = ctx.container.resolve(ConnectionRegistry);
        const listConnections = ctx.container.resolve(WebsocketsListConnectionsUseCase);

        const resultNoConnections = await listConnections.execute({
            where: {
                identityId: "id-1"
            }
        });
        expect(resultNoConnections.value).toEqual([]);

        await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            identity: {
                id: "id-1",
                displayName: "John Doe",
                type: "admin"
            },
            endpoint: "https://webiny.com/dev",
            connectedOn: new Date().toISOString()
        });

        const resultWithConnections = await listConnections.execute({
            where: {
                identityId: "id-1"
            }
        });
        expect(resultWithConnections.value).toEqual([
            {
                connectionId: "connection-1",
                tenant: "root",
                identity: {
                    id: "id-1",
                    displayName: "John Doe",
                    type: "admin"
                },
                endpoint: "https://webiny.com/dev",
                connectedOn: expect.any(String)
            }
        ]);
    });

    it("should properly send a message via transport", async () => {
        const { handle } = useHandler();
        const ctx = await handle();
        const registry = ctx.container.resolve(ConnectionRegistry);
        const sendToIdentity = ctx.container.resolve(WebsocketsSendToIdentityUseCase);

        await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            identity: {
                id: "id-1",
                displayName: "John Doe",
                type: "admin"
            },
            endpoint: "https://webiny.com/dev",
            connectedOn: new Date().toISOString()
        });

        const result = await sendToIdentity.execute<{ mockData?: boolean }>(
            {
                id: "id-1"
            },
            {
                data: {
                    mockData: true
                }
            }
        );

        expect(result.isOk()).toBe(true);
    });
});
