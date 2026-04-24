import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { createPermissionsAbstraction, createPermissionsFeature } from "./createPermissions.js";
import { createPermissionSchema } from "./createPermissionSchema.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { IdentityContext as IdentityContextImpl } from "~/features/security/IdentityContext/IdentityContext.js";
import { Identity } from "~/domain/Identity.js";

const TEST_SCHEMA = createPermissionSchema({
    prefix: "test",
    fullAccess: true,
    entities: [
        {
            id: "page",
            title: "Page",
            permission: "test.page",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        }
    ]
} as const);

const TestPermissions = createPermissionsAbstraction(TEST_SCHEMA);
const TestPermissionsFeature = createPermissionsFeature(TEST_SCHEMA, TestPermissions);

function resolve(permissions: Array<{ name: string; [key: string]: any }>) {
    const container = new Container();
    container.register(IdentityContextImpl).inSingletonScope();
    TestPermissionsFeature.register(container);

    const identityContext = container.resolve(IdentityContext);
    identityContext.setIdentity(
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

    return container.resolve(TestPermissions);
}

describe("SchemaPermissions", () => {
    describe("full access", () => {
        it("grants everything with unrestricted wildcard", () => {
            const p = resolve([{ name: "test.*" }]);
            expect(p.canAccess("page")).toBe(true);
            expect(p.canRead("page")).toBe(true);
            expect(p.canCreate("page")).toBe(true);
            expect(p.canEdit("page")).toBe(true);
            expect(p.canDelete("page")).toBe(true);
            expect(p.canPublish("page")).toBe(true);
            expect(p.canUnpublish("page")).toBe(true);
        });

        it("rejects wildcard with rwd restriction as non-full access", () => {
            const p = resolve([{ name: "test.*", rwd: "r" }]);
            expect(p.canCreate("page")).toBe(false);
            expect(p.canDelete("page")).toBe(false);
        });
    });

    describe("entity-level access", () => {
        it("grants access when entity permission exists", () => {
            const p = resolve([{ name: "test.page" }]);
            expect(p.canAccess("page")).toBe(true);
        });

        it("denies access when no permission exists", () => {
            const p = resolve([]);
            expect(p.canAccess("page")).toBe(false);
        });
    });

    describe("rwd actions", () => {
        it("respects read permission", () => {
            const p = resolve([{ name: "test.page", rwd: "r" }]);
            expect(p.canRead("page")).toBe(true);
            expect(p.canCreate("page")).toBe(false);
            expect(p.canDelete("page")).toBe(false);
        });

        it("respects write permission", () => {
            const p = resolve([{ name: "test.page", rwd: "rw" }]);
            expect(p.canRead("page")).toBe(true);
            expect(p.canCreate("page")).toBe(true);
            expect(p.canEdit("page")).toBe(true);
            expect(p.canDelete("page")).toBe(false);
        });

        it("respects delete permission", () => {
            const p = resolve([{ name: "test.page", rwd: "d" }]);
            expect(p.canDelete("page")).toBe(true);
            expect(p.canRead("page")).toBe(false);
        });
    });

    describe("publish/unpublish actions", () => {
        it("grants publish when pw includes p", () => {
            const p = resolve([{ name: "test.page", pw: "p" }]);
            expect(p.canPublish("page")).toBe(true);
            expect(p.canUnpublish("page")).toBe(false);
        });

        it("grants both when pw includes pu", () => {
            const p = resolve([{ name: "test.page", pw: "pu" }]);
            expect(p.canPublish("page")).toBe(true);
            expect(p.canUnpublish("page")).toBe(true);
        });
    });

    describe("own scope", () => {
        it("allows edit when item is owned by the user", () => {
            const p = resolve([{ name: "test.page", own: true }]);
            expect(p.canEdit("page", { createdBy: { id: "test-user" } })).toBe(true);
        });

        it("denies edit when item is owned by someone else", () => {
            const p = resolve([{ name: "test.page", own: true }]);
            expect(p.canEdit("page", { createdBy: { id: "other-user" } })).toBe(false);
        });

        it("allows edit when no item is provided (optimistic)", () => {
            const p = resolve([{ name: "test.page", own: true }]);
            expect(p.canEdit("page")).toBe(true);
        });

        it("denies delete when item is owned by someone else", () => {
            const p = resolve([{ name: "test.page", own: true }]);
            expect(p.canDelete("page", { createdBy: { id: "other-user" } })).toBe(false);
        });
    });
});
