import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER
} from "./identities.js";

export interface TestUser {
    identity: IdentityData;
    teams: string[];
}

/**
 * The stored admin users routing sees (R111), as in the CMS package. REQUESTER is a member of the
 * review team here so "minus the requester" is exercised; the reviewers' own team lookup
 * (`FakeListUserTeams` in `userContext.ts`) is unchanged.
 */
export const TEST_USERS: TestUser[] = [
    { identity: REQUESTER, teams: [REVIEW_TEAM] },
    { identity: REVIEWER, teams: [REVIEW_TEAM] },
    { identity: OTHER_REVIEWER, teams: [REVIEW_TEAM] },
    { identity: READER, teams: [] },
    { identity: REASSIGNER, teams: [] },
    { identity: EDITOR, teams: [] }
];

const toAdminUser = (user: TestUser): AdminUser => {
    return {
        id: user.identity.id,
        displayName: user.identity.displayName,
        email: `${user.identity.id}@webiny.test`,
        teams: user.teams,
        tenant: "root",
        createdOn: "2026-10-01T00:00:00.000Z",
        createdBy: null
    };
};

/** `ListUsersUseCase` over a fixed directory, honouring `id_in` and `teams_in` like the storage. */
export class FakeListUsers implements ListUsersUseCase.Interface {
    public constructor(private users: TestUser[]) {}

    public async execute(
        input?: ListUsersInput
    ): Promise<Result<AdminUser[], ListUsersUseCase.Error>> {
        const ids = input?.where?.id_in;
        const teams = input?.where?.teams_in;
        return Result.ok(
            this.users
                .filter(user => !ids || ids.includes(user.identity.id))
                .filter(user => !teams || user.teams.some(team => teams.includes(team)))
                .map(toAdminUser)
        );
    }
}

/**
 * The directory for routing (`legacyPlugins`): `ListUsersUseCase`, whose users the candidate
 * checks evaluate (R68). Give the users their page permissions with `permissionsByIdentity`.
 */
export const registerTestUsers = (container: Container) => {
    container.registerInstance(ListUsersUseCase, new FakeListUsers(TEST_USERS));
};
