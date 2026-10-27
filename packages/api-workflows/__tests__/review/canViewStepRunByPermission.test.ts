import { describe, expect, it } from "vitest";
import { canViewStepRunByPermission } from "~/domain/review/canViewStepRunByPermission.js";
import type { Actor, ReviewPermissionViewer } from "~/domain/review/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import { aiActor, requester, reviewer } from "~tests/__helpers/fixtures.js";

const NO_PERMISSIONS: WorkflowsPermissionSet = {
    fullAccess: false,
    editor: false,
    reassign: false
};
const EDITOR: WorkflowsPermissionSet = { fullAccess: false, editor: true, reassign: false };
const REASSIGN: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: true };
const BOTH: WorkflowsPermissionSet = { fullAccess: false, editor: true, reassign: true };
const FULL_ACCESS: WorkflowsPermissionSet = { fullAccess: true, editor: true, reassign: true };

const viewerOf = (
    actor: Actor,
    permissions: WorkflowsPermissionSet = NO_PERMISSIONS
): ReviewPermissionViewer => {
    return { actor, permissions };
};

describe("canViewStepRunByPermission (R258, D90)", () => {
    it("allows a viewer with editor, reassign, both or full access", () => {
        expect(canViewStepRunByPermission(viewerOf(reviewer, EDITOR))).toBe(true);
        expect(canViewStepRunByPermission(viewerOf(reviewer, REASSIGN))).toBe(true);
        expect(canViewStepRunByPermission(viewerOf(reviewer, BOTH))).toBe(true);
        expect(canViewStepRunByPermission(viewerOf(reviewer, FULL_ACCESS))).toBe(true);
    });

    it("refuses a viewer without either permission, the requester and an AI actor included", () => {
        expect(canViewStepRunByPermission(viewerOf(reviewer))).toBe(false);
        expect(canViewStepRunByPermission(viewerOf(requester))).toBe(false);
        expect(canViewStepRunByPermission(viewerOf(aiActor))).toBe(false);
    });
});
