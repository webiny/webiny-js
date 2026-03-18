import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { createHasPermission } from "./createHasPermission.js";
import { createPermissionSchema } from "./createPermissionSchema.js";
import { Identity } from "~/domain/Identity.js";

/**
 * Mutable ref updated before each test so the mock always reflects the current identity.
 * Using a ref (not a plain variable) keeps the mock factory closure stable across tests.
 */
const identityRef = { current: Identity.createAnonymous() };

vi.mock("~/presentation/security/hooks/useIdentity.js", () => ({
    useIdentity: () => ({ identity: identityRef.current, isAuthenticated: true })
}));

const TEST_SCHEMA = createPermissionSchema({
    prefix: "test",
    fullAccess: true,
    entities: [
        {
            id: "page",
            title: "Page",
            permission: "test.page",
            scopes: ["full"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        }
    ]
} as const);

const HasPermission = createHasPermission(TEST_SCHEMA);

/**
 * Each call increments the counter so every test gets a fresh identity id,
 * avoiding hits on the module-level permission cache in usePermissions.ts.
 */
let idCounter = 0;

function makeIdentity(permissions: Array<{ name: string; [key: string]: any }>) {
    return Identity.createAuthenticated({
        id: `test-identity-${++idCounter}`,
        displayName: "Test User",
        type: "admin",
        roles: [],
        teams: [],
        permissions,
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
}

const CHILD_TEXT = "protected content";

const withPermissions = (
    permissions: Array<{ name: string; [key: string]: any }>,
    jsx: React.ReactElement
) => {
    identityRef.current = makeIdentity(permissions);
    return render(jsx);
};

afterEach(() => {
    cleanup();
});

describe("createHasPermission", () => {
    describe("single action", () => {
        it("renders children when the user has the required action", () => {
            withPermissions([{ name: "test.page", pw: "p" }], (
                <HasPermission entity={"page"} action={"publish"}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });

        it("renders nothing when the user lacks the required action", () => {
            withPermissions([{ name: "test.page", pw: "u" }], (
                <HasPermission entity={"page"} action={"publish"}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.queryByText(CHILD_TEXT)).toBeNull();
        });

        it("renders nothing when the user has no permissions at all", () => {
            withPermissions([], (
                <HasPermission entity={"page"} action={"publish"}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.queryByText(CHILD_TEXT)).toBeNull();
        });
    });

    describe("array of actions (OR — default)", () => {
        it("renders children when the user has all actions in the array", () => {
            withPermissions([{ name: "test.page", pw: "pu" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });

        it("renders children when the user has only one of the actions", () => {
            withPermissions([{ name: "test.page", pw: "p" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });

        it("renders children when only the last action in the array is allowed", () => {
            withPermissions([{ name: "test.page", rwd: "rw" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish", "edit"]}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });

        it("renders nothing when the user has none of the actions", () => {
            withPermissions([{ name: "test.page", rwd: "r" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.queryByText(CHILD_TEXT)).toBeNull();
        });
    });

    describe("requireAllActions flag", () => {
        it("renders children when the user has all actions in the array", () => {
            withPermissions([{ name: "test.page", pw: "pu" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]} requireAllActions>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });

        it("renders nothing when the user has only one of the required actions", () => {
            withPermissions([{ name: "test.page", pw: "p" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]} requireAllActions>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.queryByText(CHILD_TEXT)).toBeNull();
        });

        it("renders nothing when the user has none of the required actions", () => {
            withPermissions([{ name: "test.page", rwd: "r" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]} requireAllActions>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.queryByText(CHILD_TEXT)).toBeNull();
        });

        it("is ignored when action is a single string", () => {
            withPermissions([{ name: "test.page", pw: "p" }], (
                <HasPermission entity={"page"} action={"publish"} requireAllActions>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });
    });

    describe("no action (entity access only)", () => {
        it("renders children when the user has any permission for the entity", () => {
            withPermissions([{ name: "test.page", rwd: "r" }], (
                <HasPermission entity={"page"}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });

        it("renders nothing when the user has no permission for the entity", () => {
            withPermissions([], (
                <HasPermission entity={"page"}>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.queryByText(CHILD_TEXT)).toBeNull();
        });
    });

    describe("full access", () => {
        it("renders children regardless of the action when the user has full access", () => {
            withPermissions([{ name: "test.*" }], (
                <HasPermission entity={"page"} action={["publish", "unpublish"]} requireAllActions>
                    <span>{CHILD_TEXT}</span>
                </HasPermission>
            ));
            expect(screen.getByText(CHILD_TEXT)).toBeTruthy();
        });
    });
});
