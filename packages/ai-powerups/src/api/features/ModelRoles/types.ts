import type { IAiPowerUpsSettings } from "~/api/types.js";
import type { AiModelRoleId } from "./roles.js";

export interface AiModelRoleAssignment {
    /** Empty string means the role is unfilled. */
    connectionId: string;
    /** Fully qualified, e.g. `"anthropic/claude-sonnet-4-5"`. Empty string means unfilled. */
    model: string;
}

export type AiModelRoleAssignments = Record<AiModelRoleId, AiModelRoleAssignment>;

declare module "~/api/types.js" {
    interface IAiPowerUpsSettings {
        modelRoles: {
            roles: AiModelRoleAssignments;
        };
    }
}

export type ModelRolesSettings = IAiPowerUpsSettings["modelRoles"];

export interface PersistedModelRoles {
    roles?: Partial<Record<string, Partial<AiModelRoleAssignment>>>;
}

export const emptyAssignment = (): AiModelRoleAssignment => ({ connectionId: "", model: "" });
