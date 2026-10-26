import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { FakeListTeams } from "./FakeListTeams.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { createContextHandler } from "./handler.js";
import { FakeListUsers, type FakeUser } from "./FakeListUsers.js";
import { createTeam, FakeListUserTeams } from "./FakeListUserTeams.js";
import { FakeWorkflowSettings } from "./FakeWorkflowSettings.js";
import {
    FakeReviewTargetReadAccess,
    readableUsers,
    readChecks,
    throwingReadChecks
} from "./FakeReviewTargetReadAccess.js";
import {
    FakeReviewTargetFolderChain,
    folderChainCalls,
    folderChainFaults,
    folderChains
} from "./FakeReviewTargetFolderChain.js";
import { OTHER_TEAM_ID, requester, REVIEW_TEAM_ID } from "./fixtures.js";

export const LEGAL_TEAM_ID = "team-legal";

/**
 * Reviewers Anna, Bob and Cara (Cara also in legal), Dan in another team, and the requester, who
 * is a member of the reviewers' team too. Sorted by id: anna, bob, cara, dan, requester.
 */
export const ROUTING_USERS: FakeUser[] = [
    { id: "user-anna", displayName: "Anna", teams: [REVIEW_TEAM_ID] },
    { id: "user-bob", displayName: "Bob", teams: [REVIEW_TEAM_ID] },
    { id: "user-cara", displayName: "Cara", teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID] },
    { id: "user-dan", displayName: "Dan", teams: [OTHER_TEAM_ID] },
    { id: requester.id, displayName: requester.displayName, teams: [REVIEW_TEAM_ID] }
];

/** Clears the module-level state of the read access and folder chain fakes. */
export const resetRoutingFakes = (): void => {
    readableUsers.clear();
    readChecks.length = 0;
    throwingReadChecks.clear();
    folderChains.clear();
    folderChainCalls.length = 0;
    folderChainFaults.throwNext = false;
};

/**
 * Context with the routing fakes: `ROUTING_USERS` as the admin users, the requester in the
 * "other" team, settings without exclusions, and the "cms.article" read access and folder chain
 * fakes. `params.setup` runs after the fakes are registered.
 */
export const createRoutingContext = async (params: CmsTestHandlerParams = {}) => {
    const users = new FakeListUsers(ROUTING_USERS);
    const teams = new FakeListUserTeams(new Map([[requester.id, [createTeam(OTHER_TEAM_ID)]]]));
    const settings = new FakeWorkflowSettings();
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, users);
            container.registerInstance(ListUserTeamsUseCase, teams);
            // The routing teams exist, so a save with a team target passes the deleted-team check (D174).
            container.registerInstance(
                ListTeamsUseCase,
                new FakeListTeams([
                    { id: REVIEW_TEAM_ID, name: "Reviewers" },
                    { id: OTHER_TEAM_ID, name: "Other" },
                    { id: LEGAL_TEAM_ID, name: "Legal" }
                ])
            );
            container.registerInstance(GetWorkflowSettingsUseCase, settings);
            container.register(FakeReviewTargetReadAccess);
            container.register(FakeReviewTargetFolderChain);
            await params.setup?.(container);
        }
    });
    users.watch(context.container.resolve(IdentityContext));
    return { context, users, teams, settings };
};
