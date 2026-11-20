import { describe, it, expect, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import { DisconnectUseCase } from "~/features/Disconnect/DisconnectUseCase.js";
import { WebsocketsGraphQLFactory } from "~/graphql/WebsocketsGraphQLFactory.js";

/**
 * Pure unit tests (no DynamoDB): an empty `identityId` / `tenant` / `connections` must be
 * rejected instead of falling through to "list all" and disconnecting everyone.
 */
const createListConnections = () => {
    return {
        execute: vi.fn(async () => Result.ok([]))
    };
};

const setupUseCase = () => {
    const listConnections = createListConnections();
    const disconnect = new DisconnectUseCase(
        listConnections as any,
        { unregister: vi.fn() } as any,
        { send: vi.fn(), disconnect: vi.fn() } as any
    );

    return { disconnect, listConnections };
};

const setupGraphQL = async () => {
    const resolvers = new Map<string, any>();
    const builder = {
        addTypeDefs: () => builder,
        addResolver: (config: any) => {
            resolvers.set(config.path, config.resolver);
            return builder;
        }
    };
    await new WebsocketsGraphQLFactory().execute(builder as any);

    const identityContext = {
        getPermissions: async () => [{ name: "websockets" }],
        hasFullAccess: async () => true
    };
    const tenantContext = { getTenant: () => ({ id: "root" }) };
    const listConnections = createListConnections();
    const disconnect = { execute: vi.fn(async () => Result.ok([])) };

    const call = (path: string, args: Record<string, any>) => {
        const resolver = resolvers.get(path)(
            identityContext,
            tenantContext,
            listConnections,
            disconnect
        );
        return resolver({ args, parent: {}, context: {}, info: {} });
    };

    return { call, listConnections, disconnect };
};

describe("disconnect validation", () => {
    it.each([
        ["empty identityId", { identityId: "" }],
        ["whitespace identityId", { identityId: "   " }],
        ["empty tenant", { tenant: "" }],
        ["whitespace tenant", { tenant: " " }],
        ["empty connections", { connections: [] }],
        ["empty connection id", { connections: ["abc", ""] }],
        ["empty where", {}]
    ])("use case should reject %s instead of disconnecting everyone", async (_, where) => {
        const { disconnect, listConnections } = setupUseCase();

        const result = await disconnect.execute({ where });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Websocket/Validation");
        expect(listConnections.execute).not.toHaveBeenCalled();
    });

    it("use case should allow targeted and disconnect-all calls", async () => {
        const { disconnect, listConnections } = setupUseCase();

        expect((await disconnect.execute({ where: { identityId: "id-1" } })).isOk()).toBe(true);
        expect((await disconnect.execute({ where: { tenant: "root" } })).isOk()).toBe(true);
        expect((await disconnect.execute({ where: { connections: ["c-1"] } })).isOk()).toBe(true);
        expect((await disconnect.execute()).isOk()).toBe(true);
        expect(listConnections.execute).toHaveBeenCalledTimes(4);
    });

    it.each([
        ["WebsocketsMutation.disconnectIdentity", { identityId: "" }],
        ["WebsocketsMutation.disconnectIdentity", { identityId: "  " }],
        ["WebsocketsMutation.disconnectTenant", { tenant: "" }],
        ["WebsocketsMutation.disconnectTenant", { tenant: "  " }],
        ["WebsocketsMutation.disconnect", { connections: [] }]
    ])("%s should reject %j", async (path, args) => {
        const { call, listConnections, disconnect } = await setupGraphQL();

        const response = await call(path, args);

        expect(response.data).toBeNull();
        expect(response.error.code).toBe("Websocket/Validation");
        expect(listConnections.execute).not.toHaveBeenCalled();
        expect(disconnect.execute).not.toHaveBeenCalled();
    });

    it("graphql should still allow targeted disconnects and disconnectAll", async () => {
        const { call, listConnections } = await setupGraphQL();

        const identity = await call("WebsocketsMutation.disconnectIdentity", {
            identityId: "id-1"
        });
        const all = await call("WebsocketsMutation.disconnectAll", {});

        expect(identity.error).toBeNull();
        expect(all.error).toBeNull();
        expect(listConnections.execute).toHaveBeenCalledTimes(2);
    });
});
