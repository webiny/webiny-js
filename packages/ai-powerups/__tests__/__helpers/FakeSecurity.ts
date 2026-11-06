import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { AiPowerUpsPermissions } from "~/api/features/permissions/index.js";

export interface FakeSecurityOptions {
    /** An anonymous caller, as a public request without a token resolves to. */
    anonymous?: boolean;
    /** Whether the caller holds `aiPowerups.settings`. */
    canManageSettings?: boolean;
    /** Whether the caller can edit Website Builder pages; on unless told otherwise. */
    canEditPages?: boolean;
}

export interface FakeSecurityState {
    /** Every entity `canAccess` was asked about, in order. */
    permissionChecks: string[];
    /** Every Website Builder entity `canEdit` was asked about, in order. */
    wbEditChecks: string[];
}

/**
 * Registers an `IdentityContext`, the `AiPowerUpsPermissions` the settings use cases read and the
 * `WbPermissions` page generation reads. The caller is logged in without the settings permission,
 * and with the page edit permission, unless told otherwise.
 */
export const registerFakeSecurity = (
    container: Container,
    options: FakeSecurityOptions = {}
): FakeSecurityState => {
    const anonymous = options.anonymous ?? false;
    const state: FakeSecurityState = { permissionChecks: [], wbEditChecks: [] };

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

    container.registerInstance(WbPermissions, {
        canEdit: async (entity: string) => {
            state.wbEditChecks.push(entity);
            return !anonymous && (options.canEditPages ?? true);
        }
    } as unknown as WbPermissions.Interface);

    return state;
};
