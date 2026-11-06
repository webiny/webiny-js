import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { AiPowerUpsPermissions } from "~/api/features/permissions/index.js";

export interface FakeSecurityOptions {
    /** An anonymous caller, as a public request without a token resolves to. */
    anonymous?: boolean;
    /** Whether the caller holds `aiPowerups.settings`. */
    canManageSettings?: boolean;
}

export interface FakeSecurityState {
    /** Every entity `canAccess` was asked about, in order. */
    permissionChecks: string[];
}

/**
 * Registers an `IdentityContext` and the `AiPowerUpsPermissions` the settings use cases read. The
 * caller is logged in without the settings permission unless told otherwise.
 */
export const registerFakeSecurity = (
    container: Container,
    options: FakeSecurityOptions = {}
): FakeSecurityState => {
    const anonymous = options.anonymous ?? false;
    const state: FakeSecurityState = { permissionChecks: [] };

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({
            id: anonymous ? "anonymous" : "user-1",
            type: anonymous ? "anonymous" : "admin",
            displayName: anonymous ? "Anonymous" : "User 1",
            isAnonymous: () => anonymous
        })
    } as unknown as IdentityContext.Interface);

    container.registerInstance(AiPowerUpsPermissions, {
        canAccess: async (entity: string) => {
            state.permissionChecks.push(entity);
            return !anonymous && (options.canManageSettings ?? false);
        }
    } as unknown as AiPowerUpsPermissions.Interface);

    return state;
};
