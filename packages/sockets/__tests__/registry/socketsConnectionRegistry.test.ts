import { SocketsConnectionRegistry } from "~/registry/SocketsConnectionRegistry";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";

describe("sockets connection registry", () => {
    it("should register new connections", async () => {
        const documentClient = getDocumentClient();
        const registry = new SocketsConnectionRegistry(documentClient);

        const result = await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1"
            },
            domainName: "https://webiny.com",
            stage: "dev"
        });

        expect(result).toEqual({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1"
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: expect.any(String)
        });

        for (let i = 2; i <= 10; i++) {
            await registry.register({
                connectionId: `connection-${i}`,
                tenant: i % 2 ? "root" : "anotherTenant",
                locale: "en-US",
                identity: {
                    id: `id-${i}`
                },
                domainName: "https://webiny.com",
                stage: "dev"
            });
        }

        const connectionsViaIdentity1 = await registry.listViaIdentity("id-1");
        expect(connectionsViaIdentity1).toHaveLength(1);

        const connectionsViaIdentity2 = await registry.listViaIdentity("id-2");
        expect(connectionsViaIdentity2).toHaveLength(1);

        const connectionsViaIdentity3 = await registry.listViaIdentity("id-3");
        expect(connectionsViaIdentity3).toHaveLength(1);

        const connectionsViaIdentity4 = await registry.listViaIdentity("id-4");
        expect(connectionsViaIdentity4).toHaveLength(1);

        const connectionsViaIdentity5 = await registry.listViaIdentity("id-5");
        expect(connectionsViaIdentity5).toHaveLength(1);

        const connectionsViaIdentity6 = await registry.listViaIdentity("id-6");
        expect(connectionsViaIdentity6).toHaveLength(1);

        const connectionsViaIdentity7 = await registry.listViaIdentity("id-7");
        expect(connectionsViaIdentity7).toHaveLength(1);

        const connectionsViaIdentity8 = await registry.listViaIdentity("id-8");
        expect(connectionsViaIdentity8).toHaveLength(1);

        const connectionsViaIdentity9 = await registry.listViaIdentity("id-9");
        expect(connectionsViaIdentity9).toHaveLength(1);

        const connectionsViaIdentity10 = await registry.listViaIdentity("id-10");
        expect(connectionsViaIdentity10).toHaveLength(1);

        const connectionsViaRootTenant = await registry.listViaTenant("root");
        expect(connectionsViaRootTenant).toHaveLength(5);

        const connectionsViaAnotherTenant = await registry.listViaTenant("anotherTenant");
        expect(connectionsViaAnotherTenant).toHaveLength(5);
    });

    it("should unregister connections", async () => {
        const documentClient = getDocumentClient();
        const registry = new SocketsConnectionRegistry(documentClient);

        const result = await registry.register({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1"
            },
            domainName: "https://webiny.com",
            stage: "dev"
        });

        expect(result).toEqual({
            connectionId: "connection-1",
            tenant: "root",
            locale: "en-US",
            identity: {
                id: "id-1"
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: expect.any(String)
        });

        const connectionsViaIdentity = await registry.listViaIdentity("id-1");
        expect(connectionsViaIdentity).toHaveLength(1);

        const connectionsViaRootTenant = await registry.listViaTenant("root");
        expect(connectionsViaRootTenant).toHaveLength(1);

        await registry.unregister({
            connectionId: "connection-1"
        });

        const connectionsViaIdentityAfterUnregister = await registry.listViaIdentity("id-1");
        expect(connectionsViaIdentityAfterUnregister).toHaveLength(0);

        const connectionsViaRootTenantAfterUnregister = await registry.listViaTenant("root");
        expect(connectionsViaRootTenantAfterUnregister).toHaveLength(0);
    });
});
