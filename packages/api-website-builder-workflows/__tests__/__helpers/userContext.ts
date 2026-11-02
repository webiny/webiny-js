import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "./handler.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { OTHER_REVIEWER, REVIEW_TEAM, REVIEWER } from "./identities.js";
import { FakeGetFlp } from "./FakeGetFlp.js";

/** Both reviewers are in the test step's team; nobody else is in any team. */
const TEAMS: Record<string, string[]> = {
    [REVIEWER.id]: [REVIEW_TEAM],
    [OTHER_REVIEWER.id]: [REVIEW_TEAM]
};

export interface UserContextParams {
    /** `undefined` → the default admin (`*`); `null` → anonymous. */
    identity?: IdentityData | null;
    /** Defaults to `*`. */
    permissions?: SecurityPermission[];
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
    legacyPlugins?: unknown[];
    /** Defaults to the test license (every feature on). */
    testProjectLicense?: DecryptedWcpProjectLicense;
}

/** A handler as the given identity, with fixed teams and the fake FLP (A28, A32). */
export const createUserHandler = (params: UserContextParams = {}) => {
    return createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        testProjectLicense: params.testProjectLicense,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEAMS));
                container.register(FakeFolderLevelPermissions);
                container.register(FakeGetFlp);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
};

/** A request context as the given identity, with fixed teams and the fake FLP (A28, A32). */
export const createUserContext = async (params: UserContextParams = {}): Promise<CmsContext> => {
    return (await createUserHandler(params).context()) as CmsContext;
};
