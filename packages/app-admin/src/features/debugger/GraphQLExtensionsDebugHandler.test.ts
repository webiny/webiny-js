import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { LocalStorageFeature } from "@webiny/app/features/localStorage/feature.js";
import { GraphQLExtensionsEvent } from "@webiny/app/features/graphqlClient/index.js";
import { GraphQLExtensionsEventHandler } from "@webiny/app/features/graphqlClient/index.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { Identity } from "~/domain/Identity.js";
import { DebugSessionsRepository } from "./abstractions.js";
import { DebuggerFeature } from "./feature.js";

const createContainer = (permissions: Array<{ name: string }>) => {
    const container = new Container();
    container.register(IdentityContextImpl).inSingletonScope();
    LocalStorageFeature.register(container, { prefix: "test" });
    DebuggerFeature.register(container);

    container.resolve(IdentityContext).setIdentity(
        Identity.createAuthenticated({
            id: "test-user",
            displayName: "Test User",
            type: "admin",
            roles: [],
            teams: [],
            permissions,
            profile: { external: false },
            currentTenant: { id: "root", name: "Root" },
            defaultTenant: { id: "root", name: "Root" }
        })
    );

    return container;
};

const createEvent = () => {
    return new GraphQLExtensionsEvent({
        endpoint: "https://api.example.com/graphql",
        operationName: "ListCategories",
        extensions: {
            debug: {
                enabled: true,
                requestId: "request-1",
                entries: [{ seq: 1, namespace: "cms.os.list", timestamp: 1, elapsed: 0, data: {} }]
            }
        }
    });
};

describe("GraphQLExtensionsDebugHandler", () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it("should collect debug data for an identity with the permission", async () => {
        const container = createContainer([{ name: "dev-tools.debug" }]);
        const repository = container.resolve(DebugSessionsRepository);

        expect(repository.isCaptureOn()).toBe(true);

        await container.resolve(GraphQLExtensionsEventHandler).handle(createEvent());

        expect(repository.getSessions()).toHaveLength(1);
        expect(repository.getEntryCount()).toBe(1);
        expect(repository.getSessions()[0].requestId).toBe("request-1");
    });

    it("should collect nothing once capture is turned off", async () => {
        const container = createContainer([{ name: "dev-tools.debug" }]);
        const repository = container.resolve(DebugSessionsRepository);

        repository.setCaptureOn(false);
        await container.resolve(GraphQLExtensionsEventHandler).handle(createEvent());

        expect(repository.isCaptureOn()).toBe(false);
        expect(repository.getSessions()).toHaveLength(0);
    });

    it("should not treat Dev Tools full access as the permission", async () => {
        const container = createContainer([{ name: "dev-tools.*" }]);
        const repository = container.resolve(DebugSessionsRepository);

        await container.resolve(GraphQLExtensionsEventHandler).handle(createEvent());

        expect(repository.canCapture()).toBe(false);
        expect(repository.isCaptureOn()).toBe(false);
        expect(repository.getSessions()).toHaveLength(0);
    });

    it("should drop everything on clear", async () => {
        const container = createContainer([{ name: "dev-tools.debug" }]);
        const repository = container.resolve(DebugSessionsRepository);

        await container.resolve(GraphQLExtensionsEventHandler).handle(createEvent());
        repository.clear();

        expect(repository.getSessions()).toHaveLength(0);
        expect(repository.getEntryCount()).toBe(0);
    });
});
