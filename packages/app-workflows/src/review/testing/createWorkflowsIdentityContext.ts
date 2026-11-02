import { vi } from "vitest";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import type { ITeam } from "@webiny/app-admin/domain/Identity.js";
import type { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";

export interface WorkflowsIdentityParams {
    teams?: ITeam[];
    permissions?: Identity.Permission[];
}

export const createWorkflowsIdentityContext = (
    params: WorkflowsIdentityParams = {}
): IdentityContext.Interface => {
    const identity = Identity.createAuthenticated({
        id: "user-1",
        type: "admin",
        displayName: "Maja Kos",
        roles: [],
        teams: params.teams ?? [],
        permissions: params.permissions ?? [],
        profile: { external: false },
        currentTenant: { id: "root", name: "Root" },
        defaultTenant: { id: "root", name: "Root" }
    });
    return {
        getIdentity: () => identity,
        setIdentity: vi.fn(),
        clear: vi.fn()
    };
};
