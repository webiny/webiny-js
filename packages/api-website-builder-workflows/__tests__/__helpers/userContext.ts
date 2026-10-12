import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "./handler.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { OTHER_REVIEWER, REVIEW_TEAM, REVIEWER } from "./identities.js";

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
}

/** A request context as the given identity, with fixed teams and the fake FLP (A28, A32). */
export const createUserContext = async (params: UserContextParams = {}): Promise<CmsContext> => {
    const { context } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        legacyPlugins: [
            (container: Container) => {
                container.registerInstance(ListUserTeamsUseCase, new FakeListUserTeams(TEAMS));
                container.register(FakeFolderLevelPermissions);
            },
            ...(params.legacyPlugins ?? [])
        ]
    });
    return (await context()) as CmsContext;
};
