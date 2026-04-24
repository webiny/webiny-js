import { describe, test, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    createPermissionsAbstraction,
    createPermissionsFeature
} from "~/features/security/permissions/createPermissions.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { IIdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import type { SecurityPermission } from "~/types/security.js";
import type { Permissions } from "~/features/security/permissions/types.js";

const schema = {
    prefix: "test",
    fullAccess: true,
    entities: [
        {
            id: "entry",
            permission: "test.entry",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        }
    ]
} as const;

type TestSchema = typeof schema;

function createMockIdentityContext(permissions: SecurityPermission[]): IIdentityContext {
    return {
        hasFullAccess: async () => false,
        getPermission: async (name: string) => {
            return permissions.find(p => p.name === name) ?? null;
        },
        getPermissions: async (name: string) => {
            return permissions.filter(p => p.name === name);
        },
        getIdentity: () => ({ id: "user-1", displayName: "Test User", type: "test" }),
        listPermissions: async () => permissions,
        setIdentity: () => {},
        withIdentity: async (_identity: any, cb: any) => cb(),
        withoutAuthorization: async (cb: any) => cb(),
        isAuthorizationEnabled: () => true
    } as unknown as IIdentityContext;
}

const Abstraction = createPermissionsAbstraction(schema);
const Feature = createPermissionsFeature(schema, Abstraction);

function resolvePermissions(mockIdentityContext: IIdentityContext): Permissions<TestSchema> {
    const container = new Container();
    container.registerInstance(IdentityContext, mockIdentityContext);
    Feature.register(container);
    return container.resolve(Abstraction);
}

describe("createPermissions", () => {
    describe("full access", () => {
        const permissions = resolvePermissions(createMockIdentityContext([{ name: "test.*" }]));

        test("canAccess returns true", async () => {
            expect(await permissions.canAccess("entry")).toBe(true);
        });

        test("canRead returns true", async () => {
            expect(await permissions.canRead("entry")).toBe(true);
        });

        test("canCreate returns true", async () => {
            expect(await permissions.canCreate("entry")).toBe(true);
        });

        test("canEdit returns true", async () => {
            expect(await permissions.canEdit("entry")).toBe(true);
        });

        test("canDelete returns true", async () => {
            expect(await permissions.canDelete("entry")).toBe(true);
        });

        test("canPublish returns true", async () => {
            expect(await permissions.canPublish("entry")).toBe(true);
        });

        test("canUnpublish returns true", async () => {
            expect(await permissions.canUnpublish("entry")).toBe(true);
        });

        test("canAction returns true", async () => {
            expect(await permissions.canAction("someAction", "entry")).toBe(true);
        });

        test("onlyOwnRecords returns false", async () => {
            expect(await permissions.onlyOwnRecords("entry")).toBe(false);
        });
    });

    describe("no access", () => {
        const permissions = resolvePermissions(createMockIdentityContext([]));

        test("canAccess returns false", async () => {
            expect(await permissions.canAccess("entry")).toBe(false);
        });

        test("canRead returns false", async () => {
            expect(await permissions.canRead("entry")).toBe(false);
        });

        test("canCreate returns false", async () => {
            expect(await permissions.canCreate("entry")).toBe(false);
        });

        test("canEdit returns false", async () => {
            expect(await permissions.canEdit("entry")).toBe(false);
        });

        test("canDelete returns false", async () => {
            expect(await permissions.canDelete("entry")).toBe(false);
        });

        test("canPublish returns false", async () => {
            expect(await permissions.canPublish("entry")).toBe(false);
        });

        test("canUnpublish returns false", async () => {
            expect(await permissions.canUnpublish("entry")).toBe(false);
        });

        test("canAction returns false", async () => {
            expect(await permissions.canAction("someAction", "entry")).toBe(false);
        });

        test("onlyOwnRecords returns false", async () => {
            expect(await permissions.onlyOwnRecords("entry")).toBe(false);
        });
    });

    describe("entity-level read-only permissions", () => {
        const permissions = resolvePermissions(
            createMockIdentityContext([
                { name: "$test.readonly" },
                { name: "test.entry", rwd: "r" }
            ])
        );

        test("canAccess returns true", async () => {
            expect(await permissions.canAccess("entry")).toBe(true);
        });

        test("canRead returns true", async () => {
            expect(await permissions.canRead("entry")).toBe(true);
        });

        test("canCreate returns false", async () => {
            expect(await permissions.canCreate("entry")).toBe(false);
        });

        test("canEdit returns false", async () => {
            expect(await permissions.canEdit("entry")).toBe(false);
        });

        test("canDelete returns false", async () => {
            expect(await permissions.canDelete("entry")).toBe(false);
        });

        test("canPublish returns false", async () => {
            expect(await permissions.canPublish("entry")).toBe(false);
        });

        test("canUnpublish returns false", async () => {
            expect(await permissions.canUnpublish("entry")).toBe(false);
        });
    });

    describe("wildcard with rwd flag is NOT full access", () => {
        const permissions = resolvePermissions(
            createMockIdentityContext([{ name: "test.*", rwd: "r" }])
        );

        test("canAccess returns true", async () => {
            expect(await permissions.canAccess("entry")).toBe(true);
        });

        test("canRead returns true", async () => {
            expect(await permissions.canRead("entry")).toBe(true);
        });

        test("canCreate returns false", async () => {
            expect(await permissions.canCreate("entry")).toBe(false);
        });

        test("canEdit returns false", async () => {
            expect(await permissions.canEdit("entry")).toBe(false);
        });

        test("canDelete returns false", async () => {
            expect(await permissions.canDelete("entry")).toBe(false);
        });
    });

    describe("exact entity permissions checks", () => {
        const permissions = resolvePermissions(
            createMockIdentityContext([{ name: "test.entry", rwd: "r" }])
        );

        test("canAccess returns true", async () => {
            expect(await permissions.canAccess("entry")).toBe(true);
        });

        test("canRead returns true", async () => {
            expect(await permissions.canRead("entry")).toBe(true);
        });

        test("canCreate returns false", async () => {
            expect(await permissions.canCreate("entry")).toBe(false);
        });

        test("canEdit returns false", async () => {
            expect(await permissions.canEdit("entry")).toBe(false);
        });

        test("canDelete returns false", async () => {
            expect(await permissions.canDelete("entry")).toBe(false);
        });
    });
});
