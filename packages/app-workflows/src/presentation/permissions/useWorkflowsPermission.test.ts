import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Identity } from "@webiny/app-admin/domain/Identity.js";
import { useWorkflowsPermission } from "./useWorkflowsPermission.js";
import { createWorkflowsIdentityContext } from "~/review/testing/createWorkflowsIdentityContext.js";

const security = vi.hoisted(() => {
    return { identity: null as unknown };
});

vi.mock("@webiny/app-admin", () => {
    return { useSecurity: () => ({ identity: security.identity }) };
});

const setPermissions = (permissions: Identity.Permission[]): void => {
    security.identity = createWorkflowsIdentityContext({ permissions }).getIdentity();
};

describe("useWorkflowsPermission", () => {
    beforeEach(() => {
        setPermissions([]);
    });

    it("returns false for both without a workflows permission", () => {
        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: false, reassign: false });
    });

    it("reads the boolean editor and reassign of the stored permission", () => {
        setPermissions([{ name: "workflows", editor: true }]);
        const editor = renderHook(() => useWorkflowsPermission());
        setPermissions([{ name: "workflows", reassign: true }]);
        const reassign = renderHook(() => useWorkflowsPermission());

        expect(editor.result.current).toEqual({ editor: true, reassign: false });
        expect(reassign.result.current).toEqual({ editor: false, reassign: true });
    });

    it("merges the entries of several roles", () => {
        setPermissions([
            { name: "workflows", editor: true },
            { name: "workflows", reassign: true }
        ]);

        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: true, reassign: true });
    });

    it("grants both to workflows.* (the 8a hook gave editor false)", () => {
        setPermissions([{ name: "workflows.*" }]);

        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: true, reassign: true });
    });

    it("grants both to the * permission", () => {
        setPermissions([{ name: "*" }]);

        const { result } = renderHook(() => useWorkflowsPermission());

        expect(result.current).toEqual({ editor: true, reassign: true });
    });
});
