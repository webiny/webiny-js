import { describe, expect, it } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";

const resolveChecker = async (permissions: SecurityPermission[]) => {
    const { context } = await createContextHandler({ permissions });
    return context.container.resolve(WorkflowsPermissions);
};

const FULL: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };
const NONE: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: false };

describe("WorkflowsPermissions", () => {
    it("treats * as full access (D54)", async () => {
        const checker = await resolveChecker([{ name: "*" }]);

        expect(await checker.isFullAccess()).toBe(true);
        expect(await checker.canEdit()).toBe(true);
        expect(await checker.canReassign()).toBe(true);
        expect(await checker.getPermissionSet()).toEqual(FULL);
    });

    it("treats workflows.* as full access (D54)", async () => {
        const checker = await resolveChecker([{ name: "workflows.*" }]);

        expect(await checker.isFullAccess()).toBe(true);
        expect(await checker.canEdit()).toBe(true);
        expect(await checker.canReassign()).toBe(true);
        expect(await checker.getPermissionSet()).toEqual(FULL);
    });

    it("grants only editor for an editor permission", async () => {
        const checker = await resolveChecker([{ name: "workflows", editor: true }]);

        expect(await checker.getPermissionSet()).toEqual({
            fullAccess: false,
            editor: true,
            reassign: false
        });
    });

    it("grants only reassign for a reassign permission", async () => {
        const checker = await resolveChecker([{ name: "workflows", reassign: true }]);

        expect(await checker.getPermissionSet()).toEqual({
            fullAccess: false,
            editor: false,
            reassign: true
        });
    });

    it("merges actions from several workflows permissions (one per role)", async () => {
        const checker = await resolveChecker([
            { name: "workflows", editor: true, reassign: false },
            { name: "workflows", reassign: true }
        ]);

        expect(await checker.getPermissionSet()).toEqual({
            fullAccess: false,
            editor: true,
            reassign: true
        });
    });

    it("does not grant an action whose flag is false", async () => {
        const checker = await resolveChecker([
            { name: "workflows", editor: false, reassign: false }
        ]);

        expect(await checker.getPermissionSet()).toEqual(NONE);
    });

    it("grants nothing without a workflows permission", async () => {
        const checker = await resolveChecker([{ name: "cms.*" }]);

        expect(await checker.isFullAccess()).toBe(false);
        expect(await checker.canEdit()).toBe(false);
        expect(await checker.canReassign()).toBe(false);
        expect(await checker.getPermissionSet()).toEqual(NONE);
    });

    it("treats * with editor: false as full access", async () => {
        const checker = await resolveChecker([{ name: "*", editor: false }]);

        expect(await checker.getPermissionSet()).toEqual(FULL);
    });

    it("grants nothing for a workflows permission without flags", async () => {
        const checker = await resolveChecker([{ name: "workflows" }]);

        expect(await checker.getPermissionSet()).toEqual(NONE);
    });

    it("grants full access when authorization is disabled", async () => {
        const { context } = await createContextHandler({ permissions: [] });
        const identityContext = context.container.resolve(IdentityContext);
        const checker = context.container.resolve(WorkflowsPermissions);

        const permissionSet = await identityContext.withoutAuthorization(() => {
            return checker.getPermissionSet();
        });

        expect(permissionSet).toEqual(FULL);
    });
});
