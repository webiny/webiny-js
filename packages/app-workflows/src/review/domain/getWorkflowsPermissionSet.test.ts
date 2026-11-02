import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import { getWorkflowsPermissionSet } from "./getWorkflowsPermissionSet.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

const createIdentity = (permissions: Identity.Permission[]): Identity => {
    return createWorkflowsIdentityContext({ permissions }).getIdentity();
};

describe("getWorkflowsPermissionSet (R259)", () => {
    it("grants nothing without permissions", () => {
        expect(getWorkflowsPermissionSet(createIdentity([]))).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("grants nothing to an anonymous identity", () => {
        expect(getWorkflowsPermissionSet(Identity.createAnonymous())).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("ignores permissions of other apps", () => {
        const identity = createIdentity([{ name: "cms.*" }, { name: "fm.file", own: true }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("reads editor from one role", () => {
        const identity = createIdentity([{ name: "workflows", editor: true }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: true,
            reassign: false
        });
    });

    it("reads reassign from one role", () => {
        const identity = createIdentity([{ name: "workflows", reassign: true }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: false,
            reassign: true
        });
    });

    it("merges several roles: one grants editor, another reassign", () => {
        const identity = createIdentity([
            { name: "workflows", editor: true },
            { name: "workflows", reassign: true }
        ]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: true,
            reassign: true
        });
    });

    it("treats an explicit false as no access", () => {
        const identity = createIdentity([{ name: "workflows", editor: false, reassign: false }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: false,
            editor: false,
            reassign: false
        });
    });

    it("does not read the string shape the 8a hook compared against", () => {
        const identity = createIdentity([{ name: "workflows", editor: "yes" }]);

        expect(getWorkflowsPermissionSet(identity).editor).toBe(false);
    });

    it("grants everything to workflows.*", () => {
        const identity = createIdentity([{ name: "workflows.*" }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: true,
            editor: true,
            reassign: true
        });
    });

    it("grants everything to the * permission", () => {
        const identity = createIdentity([{ name: "*" }]);

        expect(getWorkflowsPermissionSet(identity)).toEqual({
            fullAccess: true,
            editor: true,
            reassign: true
        });
    });

    it("keeps full access when another role has a narrower workflows entry", () => {
        const identity = createIdentity([
            { name: "workflows", editor: false },
            { name: "workflows.*" }
        ]);

        expect(getWorkflowsPermissionSet(identity).fullAccess).toBe(true);
        expect(getWorkflowsPermissionSet(identity).reassign).toBe(true);
    });
});
