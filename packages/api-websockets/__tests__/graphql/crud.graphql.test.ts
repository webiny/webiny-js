import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import type { IWebsocketsConnectionRegistry } from "~/registry";
import type { IWebsocketsConnectionRegistryData } from "~/registry";
import type { IWebsocketsIdentity } from "@webiny/api-core/features/websockets/index.js";
import { useHandler } from "~tests/helpers/useHandler";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

vi.mock("@webiny/aws-sdk/client-apigatewaymanagementapi", () => {
    return {
        ApiGatewayManagementApiClient: class ApiGatewayManagementApiClient {
            async send(cmd: any) {
                return cmd;
            }
        },
        PostToConnectionCommand: class PostToConnectionCommand {
            public readonly input: any;

            constructor(input: any) {
                this.input = input;
            }
        },
        DeleteConnectionCommand: class DeleteConnectionCommand {
            public readonly input: any;

            constructor(input: any) {
                this.input = input;
            }
        }
    };
});

interface InsertConnectionsParams {
    suffix?: string;
    tenant?: string;
    identity?: IWebsocketsIdentity;
}

const insertConnections = async (
    registry: IWebsocketsConnectionRegistry,
    amount: number,
    params?: InsertConnectionsParams
) => {
    const { suffix, tenant, identity } = params || {};

    const connections: IWebsocketsConnectionRegistryData[] = [];
    for (let i = 0; i < amount; i++) {
        const connection: IWebsocketsConnectionRegistryData = {
            connectionId: `connection-${i}${suffix ? `-${suffix}` : ""}`,
            tenant: tenant || "root",
            identity: {
                id: `id-${i}`,
                type: "admin",
                displayName: `Admin ${i}`,
                ...identity
            },
            endpoint: "https://webiny.com/dev",
            connectedOn: new Date().toISOString()
        };
        await registry.register(connection);
        connections.push(connection);
    }
    return connections;
};

describe("crud graphql", () => {
    let registry: IWebsocketsConnectionRegistry;

    beforeEach(async () => {
        const { handle } = useHandler();
        const ctx = await handle();
        registry = ctx.container.resolve(ConnectionRegistry);
    });

    it("should list all connections", async () => {
        const { listConnections } = useGraphQLHandler();

        const [resultBeforeInsertingConnections] = await listConnections();

        expect(resultBeforeInsertingConnections.data.websockets.listConnections.data).toHaveLength(
            0
        );

        const connections = await insertConnections(registry, 50);

        const [resultAfterInsertingConnections] = await listConnections();

        expect(resultAfterInsertingConnections).toMatchObject({
            data: {
                websockets: {
                    listConnections: {
                        data: expect.arrayContaining(
                            connections.map(c => expect.objectContaining(c))
                        ),
                        error: null
                    }
                }
            }
        });
        expect(resultAfterInsertingConnections.data.websockets.listConnections.data).toHaveLength(
            50
        );
    });

    it("should list all connections for a specific identity", async () => {
        const { listConnections } = useGraphQLHandler();

        const [resultBeforeInsertingConnections] = await listConnections();

        expect(resultBeforeInsertingConnections.data.websockets.listConnections.data).toHaveLength(
            0
        );
        /**
         * Generate connections 5 * 5
         */
        for (let i = 0; i < 5; i++) {
            await insertConnections(registry, 5, {
                suffix: `iteration-${i}`
            });
        }

        const [identity1Result] = await listConnections({
            where: {
                identityId: "id-1"
            }
        });

        expect(identity1Result.data.websockets.listConnections.data).toHaveLength(5);

        const [identity2Result] = await listConnections({
            where: {
                identityId: "id-2"
            }
        });

        expect(identity2Result.data.websockets.listConnections.data).toHaveLength(5);

        const [identity3Result] = await listConnections({
            where: {
                identityId: "id-3"
            }
        });

        expect(identity3Result.data.websockets.listConnections.data).toHaveLength(5);

        /**
         * Generate some more connections
         */
        await insertConnections(registry, 5, {
            suffix: "iteration-6"
        });

        const [identity1Result2] = await listConnections({
            where: {
                identityId: "id-1"
            }
        });

        expect(identity1Result2.data.websockets.listConnections.data).toHaveLength(6);

        const [identity2Result2] = await listConnections({
            where: {
                identityId: "id-2"
            }
        });

        expect(identity2Result2.data.websockets.listConnections.data).toHaveLength(6);

        const [identity3Result2] = await listConnections({
            where: {
                identityId: "id-3"
            }
        });

        expect(identity3Result2.data.websockets.listConnections.data).toHaveLength(6);
    });

    it("should list only the current tenant's connections", async () => {
        const { listConnections } = useGraphQLHandler();
        await insertConnections(registry, 5);
        await insertConnections(registry, 5, {
            suffix: `dev`,
            tenant: "dev"
        });

        const [resultAll] = await listConnections();
        expect(resultAll.data.websockets.listConnections.data).toHaveLength(5);

        const [resultRoot] = await listConnections({
            where: {
                tenant: "root"
            }
        });
        expect(resultRoot.data.websockets.listConnections.data).toHaveLength(5);

        const [resultDev] = await listConnections({
            where: {
                tenant: "dev"
            }
        });

        expect(resultDev.data.websockets.listConnections.data).toHaveLength(0);
    });

    it("should not list another tenant's connections of the same identity", async () => {
        const { listConnections } = useGraphQLHandler();
        await insertConnections(registry, 5);
        await insertConnections(registry, 5, {
            suffix: `dev`,
            tenant: "dev"
        });

        const [identityResult] = await listConnections({
            where: {
                identityId: "id-1"
            }
        });
        expect(identityResult.data.websockets.listConnections.data).toEqual([
            expect.objectContaining({ connectionId: "connection-1", tenant: "root" })
        ]);
    });

    it("should list all connections for specific tenant", async () => {
        const { listConnections } = useGraphQLHandler();
        await insertConnections(registry, 5);

        const [resultRoot] = await listConnections({
            where: {
                tenant: "root"
            }
        });
        expect(resultRoot.data.websockets.listConnections.data).toHaveLength(5);
    });

    it("should disconnect a specific identity connection in the current tenant only", async () => {
        const { listConnections, disconnectIdentity } = useGraphQLHandler();

        const connections = await insertConnections(registry, 5);
        await insertConnections(registry, 5, {
            suffix: "dev",
            tenant: "dev"
        });

        const [resultBeforeDisconnect] = await listConnections();
        expect(resultBeforeDisconnect.data.websockets.listConnections.data).toHaveLength(5);

        const [result] = await disconnectIdentity("id-1");
        expect(result).toMatchObject({
            data: {
                websockets: {
                    disconnectIdentity: {
                        data: connections.filter(c => c.identity.id === "id-1"),
                        error: null
                    }
                }
            }
        });

        const [resultAfterDisconnect] = await listConnections();
        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(4);

        const devConnections = await registry.listViaTenant("dev");
        expect(devConnections).toHaveLength(5);
    });

    it("should disconnect the current tenant's connections", async () => {
        const { listConnections, disconnectTenant } = useGraphQLHandler();

        const connections = await insertConnections(registry, 5);
        await insertConnections(registry, 5, {
            suffix: "dev",
            tenant: "dev"
        });

        const [result] = await disconnectTenant("root");
        expect(result).toEqual({
            data: {
                websockets: {
                    disconnectTenant: {
                        data: expect.arrayContaining(connections),
                        error: null
                    }
                }
            }
        });

        const [resultAfterDisconnect] = await listConnections();
        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(0);

        const devConnections = await registry.listViaTenant("dev");
        expect(devConnections).toHaveLength(5);
    });

    it("should not disconnect another tenant's connections", async () => {
        const { disconnectTenant, disconnect } = useGraphQLHandler();

        await insertConnections(registry, 5);
        const devConnections = await insertConnections(registry, 5, {
            suffix: "dev",
            tenant: "dev"
        });

        const [tenantResult] = await disconnectTenant("dev");
        expect(tenantResult).toEqual({
            data: {
                websockets: {
                    disconnectTenant: {
                        data: [],
                        error: null
                    }
                }
            }
        });

        const [connectionsResult] = await disconnect(devConnections.map(c => c.connectionId));
        expect(connectionsResult).toEqual({
            data: {
                websockets: {
                    disconnect: {
                        data: [],
                        error: null
                    }
                }
            }
        });

        expect(await registry.listViaTenant("dev")).toHaveLength(5);
        expect(await registry.listViaTenant("root")).toHaveLength(5);
    });

    it("should disconnect all connections of the current tenant", async () => {
        const { listConnections, disconnectAll } = useGraphQLHandler();

        const connections = await insertConnections(registry, 5);
        await insertConnections(registry, 5, {
            suffix: "dev",
            tenant: "dev"
        });
        await insertConnections(registry, 5, {
            suffix: "webiny",
            tenant: "webiny"
        });

        const [resultBeforeDisconnect] = await listConnections();
        expect(resultBeforeDisconnect.data.websockets.listConnections.data).toHaveLength(5);

        const [result] = await disconnectAll();
        expect(result).toEqual({
            data: {
                websockets: {
                    disconnectAll: {
                        data: expect.arrayContaining(connections),
                        error: null
                    }
                }
            }
        });
        expect(result.data.websockets.disconnectAll.data).toHaveLength(5);

        const [resultAfterDisconnect] = await listConnections();
        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(0);

        expect(await registry.listViaTenant("dev")).toHaveLength(5);
        expect(await registry.listViaTenant("webiny")).toHaveLength(5);
    });

    it("should disconnect specific connections", async () => {
        const { listConnections, disconnect } = useGraphQLHandler();
        const connections = await insertConnections(registry, 5);

        const [resultBeforeDisconnect] = await listConnections();
        expect(resultBeforeDisconnect.data.websockets.listConnections.data).toHaveLength(5);

        const disconnectConnection = connections[0].connectionId;
        const [result] = await disconnect([disconnectConnection]);
        expect(result).toEqual({
            data: {
                websockets: {
                    disconnect: {
                        data: [connections[0]],
                        error: null
                    }
                }
            }
        });

        const [resultAfterDisconnect] = await listConnections();
        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(4);
    });

    it("should not allow unauthorized access", async () => {
        const { listConnections, disconnect, disconnectAll, disconnectIdentity, disconnectTenant } =
            useGraphQLHandler({
                permissions: []
            });

        const [listResult] = await listConnections();
        expect(listResult).toMatchObject({
            data: {
                websockets: {
                    listConnections: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORIZED",
                            message: "Not authorized!"
                        }
                    }
                }
            }
        });

        const [disconnectResult] = await disconnect(["connection-1"]);
        expect(disconnectResult).toMatchObject({
            data: {
                websockets: {
                    disconnect: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORIZED",
                            message: "Not authorized!",
                            data: null
                        }
                    }
                }
            }
        });

        const [disconnectTenantResult] = await disconnectTenant("root");
        expect(disconnectTenantResult).toMatchObject({
            data: {
                websockets: {
                    disconnectTenant: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORIZED",
                            message: "Not authorized!",
                            data: null
                        }
                    }
                }
            }
        });

        const [disconnectIdentityResult] = await disconnectIdentity("id-1");
        expect(disconnectIdentityResult).toMatchObject({
            data: {
                websockets: {
                    disconnectIdentity: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORIZED",
                            message: "Not authorized!",
                            data: null
                        }
                    }
                }
            }
        });

        const [disconnectAllResult] = await disconnectAll();
        expect(disconnectAllResult).toMatchObject({
            data: {
                websockets: {
                    disconnectAll: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORIZED",
                            message: "Not authorized!",
                            data: null
                        }
                    }
                }
            }
        });
    });
});
