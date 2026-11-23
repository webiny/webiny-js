import type { ApiSession } from "../../../support/apiSession.ts";
import { createTestUser, deleteTestUser } from "../../../support/adminUser.ts";
import type { TestUser } from "../../../support/adminUser.ts";
import { createTestRole, deleteTestRole } from "../../../support/role.ts";
import type { RolePermission } from "../../../support/role.ts";
import { readTestUserPassword } from "../../../support/signIn.ts";
import { createTestTeam, deleteTestTeam } from "../../../support/team.ts";
import type { TestTeam } from "../../../support/team.ts";

/**
 * The people of a review: an author in no team, two reviewers in team A and one in team B. All of
 * them have the same role.
 */
export interface ReviewCast {
    roleId: string;
    teamA: TestTeam;
    teamB: TestTeam;
    author: TestUser;
    reviewerA1: TestUser;
    reviewerA2: TestUser;
    reviewerB: TestUser;
}

/*
 * Requesting and reviewing need no workflows permission: those cover managing workflows and
 * reassigning only. They need Headless CMS access to the entry instead: write to request a review,
 * read to review it, publish to publish it once approved. The role form offers CMS access as Full
 * or Own only, so this is its Full access.
 */
const AUTHOR_PERMISSIONS: RolePermission[] = [{ name: "cms.*" }];

interface CastMember {
    key: "author" | "reviewerA1" | "reviewerA2" | "reviewerB";
    lastName: string;
    teams: TestTeam[];
}

/** Creates the role, both teams and the four users, every name unique to `runId`. */
export const createReviewCast = async (session: ApiSession, runId: string): Promise<ReviewCast> => {
    const roleId = await createTestRole(session, {
        name: `E2E review people ${runId}`,
        slug: `e2e-review-people-${runId}`,
        permissions: AUTHOR_PERMISSIONS
    });
    const teamA = await createTestTeam(session, `${runId}-a`);
    const teamB = await createTestTeam(session, `${runId}-b`);
    const password = readTestUserPassword();

    const members: CastMember[] = [
        { key: "author", lastName: `Author ${runId}`, teams: [] },
        { key: "reviewerA1", lastName: `ReviewerA1 ${runId}`, teams: [teamA] },
        { key: "reviewerA2", lastName: `ReviewerA2 ${runId}`, teams: [teamA] },
        { key: "reviewerB", lastName: `ReviewerB ${runId}`, teams: [teamB] }
    ];
    // No API creates several users at once; they are created side by side.
    const created = await Promise.all(
        members.map(member => {
            return createTestUser(session, {
                email: `e2e-wf-${member.key.toLowerCase()}-${runId}@example.com`,
                firstName: "E2E",
                lastName: member.lastName,
                password,
                roleIds: [roleId],
                teamIds: member.teams.map(team => team.id)
            });
        })
    );
    const [author, reviewerA1, reviewerA2, reviewerB] = created;

    return {
        roleId,
        teamA,
        teamB,
        author,
        reviewerA1,
        reviewerA2,
        reviewerB
    };
};

/** Deletes the users, then the teams and the role. Returns every error message. */
export const deleteReviewCast = async (
    session: ApiSession,
    cast: ReviewCast
): Promise<string[]> => {
    const users = [cast.author, cast.reviewerA1, cast.reviewerA2, cast.reviewerB];
    const problems: (string | null)[] = await Promise.all(
        users.map(user => {
            return deleteTestUser(session, user);
        })
    );
    problems.push(await deleteTestTeam(session, cast.teamA));
    problems.push(await deleteTestTeam(session, cast.teamB));
    problems.push(await deleteTestRole(session, cast.roleId));
    return problems.filter((problem): problem is string => problem !== null);
};
