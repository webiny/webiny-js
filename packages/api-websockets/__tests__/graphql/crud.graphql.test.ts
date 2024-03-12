import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb";
import { IWebsocketsConnectionRegistryData, WebsocketsConnectionRegistry } from "~/registry";
import { IWebsocketsIdentity } from "~/context";

jest.mock("@webiny/aws-sdk/client-apigatewaymanagementapi", () => {
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
    locale?: string;
    identity?: IWebsocketsIdentity;
}

const insertConnections = async (amount: number, params?: InsertConnectionsParams) => {
    const { suffix, tenant, locale, identity } = params || {};
    const documentClient = getDocumentClient();
    const registry = new WebsocketsConnectionRegistry(documentClient);

    const connections: IWebsocketsConnectionRegistryData[] = [];
    for (let i = 0; i < amount; i++) {
        const connection: IWebsocketsConnectionRegistryData = {
            connectionId: `connection-${i}${suffix ? `-${suffix}` : ""}`,
            tenant: tenant || "root",
            locale: locale || "en-US",
            identity: {
                id: `id-${i}`,
                type: "admin",
                displayName: `Admin ${i}`,
                ...identity
            },
            domainName: "https://webiny.com",
            stage: "dev",
            connectedOn: new Date().toISOString()
        };
        await registry.register(connection);
        connections.push(connection);
    }
    return connections;
};

describe("crud graphql", () => {
    it("should list all connections", async () => {
        const { listConnections } = useGraphQLHandler();

        const [resultBeforeInsertingConnections] = await listConnections();

        expect(resultBeforeInsertingConnections.data.websockets.listConnections.data).toHaveLength(
            0
        );

        const connections = await insertConnections(50);

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
            await insertConnections(5, {
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
        await insertConnections(5, {
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

    it("should list all connections for a specific tenant", async () => {
        const { listConnections } = useGraphQLHandler();
        await insertConnections(5);
        await insertConnections(5, {
            suffix: `dev`,
            tenant: "dev"
        });

        const [resultAll] = await listConnections();
        expect(resultAll.data.websockets.listConnections.data).toHaveLength(10);

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

        expect(resultDev.data.websockets.listConnections.data).toHaveLength(5);
    });

    it("should list all connections for specific tenant/locale", async () => {
        const { listConnections } = useGraphQLHandler();
        await insertConnections(5);
        await insertConnections(5, {
            suffix: `root-hr-HR`,
            locale: "hr-HR"
        });

        const [resultAll] = await listConnections();
        expect(resultAll.data.websockets.listConnections.data).toHaveLength(10);

        const [resultRoot] = await listConnections({
            where: {
                tenant: "root",
                locale: "en-US"
            }
        });
        expect(resultRoot.data.websockets.listConnections.data).toHaveLength(5);

        const [resultDev] = await listConnections({
            where: {
                tenant: "root",
                locale: "hr-HR"
            }
        });

        expect(resultDev.data.websockets.listConnections.data).toHaveLength(5);
    });

    it("should disconnect a specific identity connection", async () => {
        const { listConnections, disconnectIdentity } = useGraphQLHandler();

        const connections = await insertConnections(5);

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
    });

    it("should disconnect a specific tenant connection", async () => {
        const { listConnections, disconnectTenant } = useGraphQLHandler();

        const connections = await insertConnections(5);
        await insertConnections(5, {
            suffix: "dev",
            tenant: "dev"
        });

        const [resultBeforeDisconnect] = await listConnections();
        expect(resultBeforeDisconnect.data.websockets.listConnections.data).toHaveLength(10);

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

        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(5);
    });

    it("should disconnect specific tenant/locale combination", async () => {
        const { listConnections, disconnectTenant } = useGraphQLHandler();

        const rootEnConnections = await insertConnections(5);
        const devEnConnections = await insertConnections(5, {
            suffix: "dev-en",
            tenant: "dev",
            locale: "en-US"
        });
        await insertConnections(5, {
            suffix: "dev-hr",
            tenant: "dev",
            locale: "hr-HR"
        });

        const [resultBeforeDisconnect] = await listConnections();
        expect(resultBeforeDisconnect.data.websockets.listConnections.data).toHaveLength(15);

        const [result] = await disconnectTenant("dev", "en-US");
        expect(result).toEqual({
            data: {
                websockets: {
                    disconnectTenant: {
                        data: expect.arrayContaining(devEnConnections),
                        error: null
                    }
                }
            }
        });

        const [resultAfterDisconnect] = await listConnections();
        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(10);

        const [resultRoot] = await disconnectTenant("root", "en-US");
        expect(resultRoot).toEqual({
            data: {
                websockets: {
                    disconnectTenant: {
                        data: expect.arrayContaining(rootEnConnections),
                        error: null
                    }
                }
            }
        });

        const [resultAfterRootDisconnect] = await listConnections();
        expect(resultAfterRootDisconnect.data.websockets.listConnections.data).toHaveLength(5);
    });

    it("should disconnect all connections", async () => {
        const { listConnections, disconnectAll } = useGraphQLHandler();

        const connections = [
            ...(await insertConnections(5)),
            ...(await insertConnections(5, {
                suffix: "dev",
                tenant: "dev"
            })),
            ...(await insertConnections(5, {
                suffix: "webiny",
                tenant: "webiny",
                locale: "de-DE"
            })),

            ...(await insertConnections(5, {
                suffix: "webiny-en",
                tenant: "webiny",
                locale: "en-US"
            }))
        ];

        const [resultBeforeDisconnect] = await listConnections();
        expect(resultBeforeDisconnect.data.websockets.listConnections.data).toHaveLength(20);

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

        const [resultAfterDisconnect] = await listConnections();
        expect(resultAfterDisconnect.data.websockets.listConnections.data).toHaveLength(0);
    });

    it("should disconnect specific connections", async () => {
        const { listConnections, disconnect } = useGraphQLHandler();
        const connections = await insertConnections(5);

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
                            code: "SECURITY_NOT_AUTHORIZED",
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
                            code: "SECURITY_NOT_AUTHORIZED",
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
                            code: "SECURITY_NOT_AUTHORIZED",
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
                            code: "SECURITY_NOT_AUTHORIZED",
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
                            code: "SECURITY_NOT_AUTHORIZED",
                            message: "Not authorized!",
                            data: null
                        }
                    }
                }
            }
        });
    });
});
