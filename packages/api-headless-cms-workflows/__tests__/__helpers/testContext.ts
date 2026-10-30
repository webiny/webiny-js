import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { Container } from "@webiny/di";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { expectOk } from "./entries.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { FakeListUserTeams } from "./FakeListUserTeams.js";
import { OTHER_REVIEWER, REVIEW_TEAM, REVIEWER } from "./identities.js";
import { FakeGetFlp } from "./FakeGetFlp.js";

/** Both reviewers are in the test step's team; nobody else is in any team. */
export const TEST_TEAMS: Record<string, string[]> = {
    [REVIEWER.id]: [REVIEW_TEAM],
    [OTHER_REVIEWER.id]: [REVIEW_TEAM]
};

export interface TestContextParams {
    /** Binds the test workflow to the "author" model; `true` by default. */
    withWorkflow?: boolean;
    legacyPlugins?: unknown[];
    /** Makes the "author" model private. */
    privateModel?: boolean;
    /** `null` makes the request anonymous. */
    identity?: IdentityData | null;
    permissions?: SecurityPermission[];
    /** Permissions of other users, for routing and candidate read checks (`withIdentity`). */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
    /** Registers fixed team lookups (`FakeListUserTeams`). */
    fakeTeams?: boolean;
    /** Registers the fake folder-level permissions (A28). */
    fakeFolderLevelPermissions?: boolean;
}

/** A CMS context with the "author" model, by default bound to the test workflow. */
export const createTestContext = async (params: TestContextParams = {}): Promise<CmsContext> => {
    const { context } = createContextHandler({
        identity: params.identity,
        permissions: params.permissions,
        permissionsByIdentity: params.permissionsByIdentity,
        legacyPlugins: [
            (container: Container) => {
                if (params.fakeTeams) {
                    container.registerInstance(
                        ListUserTeamsUseCase,
                        new FakeListUserTeams(TEST_TEAMS)
                    );
                }
                if (params.fakeFolderLevelPermissions) {
                    container.register(FakeFolderLevelPermissions);
                    container.register(FakeGetFlp);
                }
            },
            ...(params.legacyPlugins ?? [])
        ],
        modifyModel: params.privateModel
            ? model => {
                  return { ...model, isPrivate: true };
              }
            : undefined
    });
    const ctx = await context();
    if (params.withWorkflow !== false) {
        expectOk(await storeWorkflow(ctx));
    }
    return ctx;
};
