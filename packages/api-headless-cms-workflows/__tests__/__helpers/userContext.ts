import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createTestContext } from "./testContext.js";

export interface UserContextParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    /** Permissions of other users, for routing and candidate read checks. */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
    legacyPlugins?: unknown[];
}

/**
 * A request context as the given identity, with fixed teams and the fake FLP (A28), and no stored
 * workflow. Data persists across contexts within one test (A32), so tests set up as the admin and
 * act as another user.
 */
export const createUserContext = (params: UserContextParams = {}): Promise<CmsContext> => {
    return createTestContext({
        withWorkflow: false,
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        legacyPlugins: params.legacyPlugins,
        fakeTeams: true,
        fakeFolderLevelPermissions: true
    });
};
