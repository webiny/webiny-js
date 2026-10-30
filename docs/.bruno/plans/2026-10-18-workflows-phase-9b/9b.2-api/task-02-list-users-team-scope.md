### Task 2: `listUsers` team scope and the teams-flag test helper

R286, R287, R311, A101, A103, D170, Q49, Q58; Review Focus 5, 8 (`00-shared.md`). The phase 9b Global Constraints and the 9a, 8b and 8a ones they inherit apply unchanged (read: R87/D132 never throw out of a dependency, internal engine use cases check no permission, no helper wrappers around dependency calls, one class or one public function per file, one named import per line, namespace types `Foo.Interface`, comments end with a period, no nested call arguments, targeted tests, the pre-commit chain, SEC ids never in code or commits).

The shared `listUsers` query gets the team scope the rule target picker needs, and the user list becomes the first place that reads the teams switch. Nothing in a base package changes: the use case injects the api-core `FeatureFlags` abstraction and reads the admin user's own `teams` list, which `ListUsersUseCase` already returns.

- **`TEAMS_FEATURE_FLAG`** (`[AWF]/constants.ts`): `"advancedAccessControlLayer.teams"`, defined once (R287). `featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG)` is read inline on every `execute`, never cached at registration; a throw from the flag read is a `WorkflowPersistenceError` (R87).
- **`ListWorkflowUsersInput.teamIds`** (`string[] | null`, optional). A user matches when any of the user's teams is in `teamIds` (the `teams_in` filter `StoreWorkflowUseCase` already uses). Combined with `search` and the limit rules, which stay as they are (default 50, 1..200, sorted by display name then id). `teamIds` is de-duplicated. An empty `teamIds` matches no user and makes no lookup (set semantics; a step with no reviewing teams has no members). An `ids` lookup ignores `search`, `limit` and `teamIds`, so a saved target that left the teams still resolves (D117).
- **Result shape.** `WorkflowUser` becomes `WorkflowListedUser { id: string; displayName: string; teamIds: string[] }`; `WorkflowUserList.users` uses it. `teamIds` comes from the admin user the use case already lists and exposes ids only, never team names (A103). A user with no teams has `teamIds: []`.
- **Teams off.** No team lookup, `teamIds: []` on every user, and a request with `teamIds` (and no `ids`) returns `{ users: [], missingIds: [] }` without calling `ListUsersUseCase`. An `ids` lookup still resolves users (teams off does not break the picker's reference resolution for Automation `user` settings).
- **GraphQL** (`[AWF]/graphql/WorkflowsSchemaFactory.ts`): `listUsers(search: String, ids: [String!], limit: Int, teamIds: [String!])`; new type `WorkflowsListedUser { id: ID! displayName: String! teamIds: [String!]! }` used by `WorkflowsUserListResult.users`. `WorkflowsUser` stays for owners and candidates. The resolver passes `teamIds` through; `editor` gate and error envelope unchanged.
- **Test helper** (R311): `packages/api-workflows/__tests__/__helpers/teamsFlag.ts` exports `setTeamsFlag(container, enabled)`, a `FeatureFlags` decorator that answers `advancedAccessControlLayer.teams` with the given value (a boolean, or a function read on every call, so a test can flip the switch between two requests) and leaves every other flag to the decorated implementation. Flags are empty by default, so teams are off in every test that does not call it.

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Modify: `packages/api-workflows/src/domain/config/types.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowUsers/abstractions.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowUsers/index.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowUsers/ListWorkflowUsersUseCase.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Create: `packages/api-workflows/__tests__/__helpers/teamsFlag.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts` (replaced in full)
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `FeatureFlags` and `FeatureFlags.createDecorator` (`@webiny/api-core/features/featureFlags/abstractions.js`; `get()` builds a new `FeatureFlags` object per call, whose `isEnabled(name)` the helper wraps, as `AiPowerupsEnabledFeatureFlags` in `ListWorkflowStepTypes.test.ts` does), `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`; `execute(input?: ListUsersInput)` with `where.id_in` and `where.teams_in`), `ListUsersInput` (`@webiny/api-core/features/users/shared/types.js`, the path `FakeListUsers.ts` and `src/features/review/ResolveReviewUserName/ResolveReviewUserNameUseCase.ts` already import), `AdminUser.teams?: string[]` (`@webiny/api-core/types/users.js`), `IdentityContext.withoutAuthorization`, `WorkflowsPermissions.canEdit`, `CurrentReviewViewer.getActor`, `WorkflowPersistenceError`, `WorkflowValidationError`, `WorkflowsNotAuthorizedError`. Test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `FakeListUsers` and `FakeUser` (`~tests/__helpers/FakeListUsers.js`; it filters by `id_in` and `teams_in` like api-core and records every call), `expectOk`, `REVIEW_TEAM_ID`, `OTHER_TEAM_ID` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract): `TEAMS_FEATURE_FLAG`; `WorkflowListedUser { id; displayName; teamIds }` and `WorkflowUserList` over it (`~/domain/config/types.js`); `ListWorkflowUsersInput.teamIds?: string[] | null`; the `WorkflowsListedUser` GraphQL type and the `teamIds` argument; `setTeamsFlag(container: Container, enabled: TeamsFlagValue): void` and `TeamsFlagValue = boolean | (() => boolean)` in `~tests/__helpers/teamsFlag.js`. Consumed by Task 5 (the flag constant and the helper) and, on the admin side, Tasks 6 and 14b (the SDL).

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/teamsFlag.ts`:

```ts
import type { Container } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";

/** The teams switch of a test: a fixed value, or a function read on every flag lookup. */
export type TeamsFlagValue = boolean | (() => boolean);

/**
 * Turns `advancedAccessControlLayer.teams` on or off for one test container (R311). Flags are
 * empty by default, so teams are off unless a test calls this. Register it in `setup`; a decorator
 * a test registers later wraps this one. Every other flag is answered by the decorated
 * implementation.
 */
export const setTeamsFlag = (container: Container, enabled: TeamsFlagValue): void => {
    class TeamsFlagFeatureFlags implements FeatureFlags.Interface {
        constructor(private decoratee: FeatureFlags.Interface) {}

        get(): ReturnType<FeatureFlags.Interface["get"]> {
            const flags = this.decoratee.get();
            const isEnabled = flags.isEnabled.bind(flags);
            flags.isEnabled = name => {
                if (name === TEAMS_FEATURE_FLAG) {
                    return typeof enabled === "function" ? enabled() : enabled;
                }
                return isEnabled(name);
            };
            return flags;
        }
    }

    container.registerDecorator(
        FeatureFlags.createDecorator({ decorator: TeamsFlagFeatureFlags, dependencies: [] })
    );
};
```

Replace `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts` in full:

```ts
import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, OTHER_TEAM_ID, REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

/** The fake gives every user the email `<id>@webiny.test`. */
const USERS: FakeUser[] = [
    { id: "user-cara", displayName: "Cara Clark", teams: [OTHER_TEAM_ID] },
    { id: "user-anna", displayName: "Anna Adams", teams: [REVIEW_TEAM_ID] },
    { id: "user-bob", displayName: "bob Brown", teams: [] }
];

/** Every user lookup throws, as a crashed storage driver does. */
class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): ReturnType<ListUsersUseCase.Interface["execute"]> {
        throw new Error("Users are down.");
    }
}

/** Throws from the flag read. */
class ThrowingFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get(): ReturnType<FeatureFlags.Interface["get"]> {
        throw new Error("Flags are down.");
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface UsersContextParams extends CmsTestHandlerParams {
    users?: FakeUser[];
    listUsers?: ListUsersUseCase.Interface;
    /** The teams switch; on unless a test says otherwise. */
    teams?: TeamsFlagValue;
}

const createUsersContext = async (params: UsersContextParams = {}) => {
    const users = new FakeListUsers(params.users ?? USERS);
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
            setTeamsFlag(container, params.teams ?? true);
            await params.setup?.(container);
        }
    });
    users.watch(context.container.resolve(IdentityContext));
    return {
        container: context.container,
        users,
        listUsers: context.container.resolve(ListWorkflowUsersUseCase)
    };
};

describe("ListWorkflowUsersUseCase (D48, D117, R123, R286)", () => {
    it("lists every user as id, display name and team ids, sorted by display name, without authorization", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute());

        expect(list).toEqual({
            users: [
                { id: "user-anna", displayName: "Anna Adams", teamIds: [REVIEW_TEAM_ID] },
                { id: "user-bob", displayName: "bob Brown", teamIds: [] },
                { id: "user-cara", displayName: "Cara Clark", teamIds: [OTHER_TEAM_ID] }
            ],
            missingIds: []
        });
        expect(users.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
    });

    it("returns only the id, the display name and the team ids of a user (A103)", async () => {
        const { listUsers } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute());

        for (const user of list.users) {
            expect(Object.keys(user).sort()).toEqual(["displayName", "id", "teamIds"]);
        }
        expect(JSON.stringify(list)).not.toContain("webiny.test");
    });

    it("searches the display name and the email, case-insensitively", async () => {
        const { listUsers } = await createUsersContext({ permissions: EDITOR });

        const byEmail = expectOk(await listUsers.execute({ search: "  ANNA@WEBINY " }));
        const byName = expectOk(await listUsers.execute({ search: "brown" }));
        const byDomain = expectOk(await listUsers.execute({ search: "webiny.test" }));
        const blank = expectOk(await listUsers.execute({ search: "   " }));

        expect(byEmail.users.map(user => user.id)).toEqual(["user-anna"]);
        expect(byName.users.map(user => user.id)).toEqual(["user-bob"]);
        expect(byDomain.users).toHaveLength(3);
        expect(blank.users).toHaveLength(3);
    });

    it("returns 50 users by default, at most 200 and at least 1 (R92)", async () => {
        const many = Array.from({ length: 205 }, (_, index): FakeUser => {
            const number = String(index).padStart(3, "0");
            return { id: `user-${number}`, displayName: `User ${number}`, teams: [] };
        });
        const { listUsers } = await createUsersContext({ permissions: EDITOR, users: many });

        const byDefault = expectOk(await listUsers.execute());
        const tooMany = expectOk(await listUsers.execute({ limit: 500 }));
        const tooFew = expectOk(await listUsers.execute({ limit: 0 }));
        const fraction = expectOk(await listUsers.execute({ limit: 2.7 }));
        const notFinite = expectOk(await listUsers.execute({ limit: Number.NaN }));

        expect(byDefault.users).toHaveLength(50);
        expect(byDefault.users[0]).toEqual({
            id: "user-000",
            displayName: "User 000",
            teamIds: []
        });
        expect(tooMany.users).toHaveLength(200);
        expect(tooFew.users).toEqual([{ id: "user-000", displayName: "User 000", teamIds: [] }]);
        expect(fraction.users).toHaveLength(2);
        expect(notFinite.users).toHaveLength(50);
    });

    describe("team filter (R286)", () => {
        it("lists the users of one team, asking for them with the team filter", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(list).toEqual({
                users: [{ id: "user-anna", displayName: "Anna Adams", teamIds: [REVIEW_TEAM_ID] }],
                missingIds: []
            });
            expect(users.calls).toEqual([
                { input: { where: { teams_in: [REVIEW_TEAM_ID] } }, authorizationEnabled: false }
            ]);
        });

        it("matches a user who is in any of the teams and de-duplicates the team ids", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const both = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID] })
            );
            const repeated = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID, REVIEW_TEAM_ID] })
            );

            expect(both.users.map(user => user.id)).toEqual(["user-anna", "user-cara"]);
            expect(repeated.users.map(user => user.id)).toEqual(["user-anna"]);
            expect(users.calls[1].input).toEqual({ where: { teams_in: [REVIEW_TEAM_ID] } });
        });

        it("reports every team of a user, also teams outside the filter", async () => {
            const members: FakeUser[] = [
                { id: "user-dora", displayName: "Dora Dunn", teams: [REVIEW_TEAM_ID, OTHER_TEAM_ID] }
            ];
            const { listUsers } = await createUsersContext({
                permissions: EDITOR,
                users: members
            });

            const list = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(list.users).toEqual([
                {
                    id: "user-dora",
                    displayName: "Dora Dunn",
                    teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID]
                }
            ]);
        });

        it("combines the team filter with the search", async () => {
            const { listUsers } = await createUsersContext({ permissions: EDITOR });

            const found = expectOk(
                await listUsers.execute({
                    teamIds: [REVIEW_TEAM_ID, OTHER_TEAM_ID],
                    search: "ADAMS"
                })
            );
            const outside = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID], search: "cara" })
            );

            expect(found.users.map(user => user.id)).toEqual(["user-anna"]);
            expect(outside.users).toEqual([]);
        });

        it("applies the limit rules to the team members", async () => {
            const members = Array.from({ length: 205 }, (_, index): FakeUser => {
                const number = String(index).padStart(3, "0");
                return { id: `user-${number}`, displayName: `User ${number}`, teams: [REVIEW_TEAM_ID] };
            });
            const { listUsers } = await createUsersContext({
                permissions: EDITOR,
                users: members
            });

            const byDefault = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));
            const limited = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID], limit: 2 })
            );
            const tooMany = expectOk(
                await listUsers.execute({ teamIds: [REVIEW_TEAM_ID], limit: 500 })
            );

            expect(byDefault.users).toHaveLength(50);
            expect(limited.users.map(user => user.id)).toEqual(["user-000", "user-001"]);
            expect(tooMany.users).toHaveLength(200);
        });

        it("matches no user and makes no lookup for an empty team filter", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(await listUsers.execute({ teamIds: [] }));

            expect(list).toEqual({ users: [], missingIds: [] });
            expect(users.calls).toEqual([]);
        });

        it("lists everyone when the team filter is null", async () => {
            const { listUsers } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(await listUsers.execute({ teamIds: null }));

            expect(list.users).toHaveLength(3);
        });

        it("ignores the team filter for an ids lookup, so a user who left the teams still resolves (D117)", async () => {
            const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

            const list = expectOk(
                await listUsers.execute({
                    ids: ["user-cara", "user-gone"],
                    teamIds: [REVIEW_TEAM_ID],
                    search: "nobody",
                    limit: 1
                })
            );

            expect(list).toEqual({
                users: [{ id: "user-cara", displayName: "Cara Clark", teamIds: [OTHER_TEAM_ID] }],
                missingIds: ["user-gone"]
            });
            expect(users.calls).toEqual([
                {
                    input: { where: { id_in: ["user-cara", "user-gone"] } },
                    authorizationEnabled: false
                }
            ]);
        });
    });

    describe("teams off (Q49, Q58, R286, R287)", () => {
        it("lists users with empty team ids and exposes no team data", async () => {
            const { listUsers, users } = await createUsersContext({
                permissions: EDITOR,
                teams: false
            });

            const list = expectOk(await listUsers.execute());

            expect(list).toEqual({
                users: [
                    { id: "user-anna", displayName: "Anna Adams", teamIds: [] },
                    { id: "user-bob", displayName: "bob Brown", teamIds: [] },
                    { id: "user-cara", displayName: "Cara Clark", teamIds: [] }
                ],
                missingIds: []
            });
            expect(JSON.stringify(list)).not.toContain(REVIEW_TEAM_ID);
            expect(JSON.stringify(list)).not.toContain(OTHER_TEAM_ID);
            expect(users.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
        });

        it("returns no users and makes no lookup for a request with team ids", async () => {
            const { listUsers, users } = await createUsersContext({
                permissions: EDITOR,
                teams: false
            });

            const list = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(list).toEqual({ users: [], missingIds: [] });
            expect(users.calls).toEqual([]);
        });

        it("still resolves an ids lookup, with empty team ids", async () => {
            const { listUsers } = await createUsersContext({ permissions: EDITOR, teams: false });

            const list = expectOk(
                await listUsers.execute({ ids: ["user-anna", "user-gone"], teamIds: ["team-x"] })
            );

            expect(list).toEqual({
                users: [{ id: "user-anna", displayName: "Anna Adams", teamIds: [] }],
                missingIds: ["user-gone"]
            });
        });

        it("reads the switch on every request, not at registration (R287)", async () => {
            let teamsOn = true;
            const { listUsers } = await createUsersContext({
                permissions: EDITOR,
                teams: () => teamsOn
            });

            const on = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));
            teamsOn = false;
            const off = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));
            teamsOn = true;
            const onAgain = expectOk(await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] }));

            expect(on.users.map(user => user.id)).toEqual(["user-anna"]);
            expect(off.users).toEqual([]);
            expect(onAgain.users.map(user => user.id)).toEqual(["user-anna"]);
        });

        it("returns the persistence error when the flag read throws (R87)", async () => {
            const { listUsers, users } = await createUsersContext({
                permissions: EDITOR,
                setup: container => {
                    container.registerDecorator(
                        FeatureFlags.createDecorator({
                            decorator: ThrowingFeatureFlags,
                            dependencies: []
                        })
                    );
                }
            });

            const result = await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] });

            expect(result.error.code).toBe("Workflows/Workflow/Persistence");
            expect(result.error.message).toBe("Flags are down.");
            expect(users.calls).toEqual([]);
        });
    });

    it("resolves ids in the given order and reports the missing ones (D117)", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(
            await listUsers.execute({
                ids: ["user-cara", "user-gone", "user-anna", "user-cara"],
                search: "nobody",
                limit: 1
            })
        );

        expect(list).toEqual({
            users: [
                { id: "user-cara", displayName: "Cara Clark", teamIds: [OTHER_TEAM_ID] },
                { id: "user-anna", displayName: "Anna Adams", teamIds: [REVIEW_TEAM_ID] }
            ],
            missingIds: ["user-gone"]
        });
        expect(users.calls).toEqual([
            {
                input: { where: { id_in: ["user-cara", "user-gone", "user-anna"] } },
                authorizationEnabled: false
            }
        ]);
    });

    it("refuses more than 200 ids without a lookup (R126)", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });
        const ids = Array.from({ length: 201 }, (_, index) => `user-${index}`);

        const result = await listUsers.execute({ ids });
        // Counted after de-duplication: 200 distinct ids plus repeats are allowed.
        const deduplicated = await listUsers.execute({ ids: [...ids.slice(0, 200), "user-0"] });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many user ids.");
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
        expect(deduplicated.isOk()).toBe(true);
        expect(users.calls).toHaveLength(1);
    });

    it("answers an empty ids list without a lookup", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute({ ids: [] }));

        expect(list).toEqual({ users: [], missingIds: [] });
        expect(users.calls).toEqual([]);
    });

    it("allows a full-access permission set", async () => {
        const { listUsers } = await createUsersContext({
            permissions: [{ name: "workflows.*" }]
        });

        const list = await listUsers.execute();

        expect(list.isOk()).toBe(true);
    });

    it("refuses a user without editor and does not list users", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: REASSIGNER });

        const result = await listUsers.execute({ search: "anna" });
        const scoped = await listUsers.execute({ teamIds: [REVIEW_TEAM_ID] });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list users" });
        expect(scoped.error.code).toBe("Workflows/NotAuthorized");
        expect(users.calls).toEqual([]);
    });

    it("refuses an anonymous identity and does not list users", async () => {
        const { container, listUsers, users } = await createUsersContext();
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            listUsers.execute()
        );

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(users.calls).toEqual([]);
    });

    it("returns the persistence error when the lookup fails (R87)", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });
        users.failuresLeft = 1;

        const failed = await listUsers.execute();

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
    });

    it("returns the persistence error when the lookup throws (R87)", async () => {
        const { listUsers } = await createUsersContext({
            permissions: EDITOR,
            listUsers: new ThrowingListUsers()
        });

        const thrown = await listUsers.execute({ ids: ["user-anna"] });

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Users are down.");
    });

    it("returns the persistence error when the permission check throws (R87)", async () => {
        const { listUsers, users } = await createUsersContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listUsers.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
        expect(users.calls).toEqual([]);
    });
});
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`.

Imports, after the `FakeListTeams` import.

Before:

```ts
import { FakeListTeams, type FakeTeam } from "~tests/__helpers/FakeListTeams.js";
```

After:

```ts
import { FakeListTeams, type FakeTeam } from "~tests/__helpers/FakeListTeams.js";
import { setTeamsFlag } from "~tests/__helpers/teamsFlag.js";
```

The `listUsers` query takes the team filter and selects the team ids.

Before:

```ts
const LIST_USERS = /* GraphQL */ `
    query ListUsers($search: String, $ids: [String!], $limit: Int) {
        workflows {
            listUsers(search: $search, ids: $ids, limit: $limit) {
                data {
                    users {
                        id
                        displayName
                    }
```

After:

```ts
const LIST_USERS = /* GraphQL */ `
    query ListUsers($search: String, $ids: [String!], $limit: Int, $teamIds: [String!]) {
        workflows {
            listUsers(search: $search, ids: $ids, limit: $limit, teamIds: $teamIds) {
                data {
                    users {
                        id
                        displayName
                        teamIds
                    }
```

The user row type.

Before:

```ts
interface UserRow {
    id: string;
    displayName: string;
}
```

After:

```ts
interface UserRow {
    id: string;
    displayName: string;
    teamIds: string[];
}
```

`createApi` takes the teams switch (off unless a test passes it; Task 5 uses it for the team and step type tests).

Before:

```ts
const createApi = async (params: CmsTestHandlerParams) => {
    const users = new FakeListUsers(API_USERS);
    const teams = new FakeListTeams(API_TEAMS);
    // The use case tests pin the `withoutAuthorization` wrap; here only the calls are counted.
    const { createQuery, createMutation } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, users);
            container.registerInstance(ListTeamsUseCase, teams);
            await params.setup?.(container);
        }
    });
```

After:

```ts
interface ApiParams extends CmsTestHandlerParams {
    /** The teams switch; absent leaves the flag off, as in every test that does not set it. */
    teams?: boolean;
}

const createApi = async (params: ApiParams) => {
    const users = new FakeListUsers(API_USERS);
    const teams = new FakeListTeams(API_TEAMS);
    // The use case tests pin the `withoutAuthorization` wrap; here only the calls are counted.
    const { createQuery, createMutation } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, users);
            container.registerInstance(ListTeamsUseCase, teams);
            if (params.teams !== undefined) {
                setTeamsFlag(container, params.teams);
            }
            await params.setup?.(container);
        }
    });
```

The user list tests.

Before:

```ts
    it("lists users for an editor, by search and by ids (D48, D117)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [searched] = await api.listUsers({ search: "ANNA" });
        const [byIds] = await api.listUsers({ ids: ["user-cara", "user-gone"] });

        expect(searched.data.workflows.listUsers).toEqual({
            data: { users: [{ id: "user-anna", displayName: "Anna Adams" }], missingIds: [] },
            error: null
        });
        expect(byIds.data.workflows.listUsers).toEqual({
            data: {
                users: [{ id: "user-cara", displayName: "Cara Clark" }],
                missingIds: ["user-gone"]
            },
            error: null
        });
        expect(api.users.calls).toHaveLength(2);
    });
```

After:

```ts
    it("lists users with their team ids for an editor, by search and by ids (D48, D117, R286)", async () => {
        const api = await createApi({ permissions: EDITOR, teams: true });

        const [searched] = await api.listUsers({ search: "ANNA" });
        const [byIds] = await api.listUsers({ ids: ["user-cara", "user-gone"] });

        expect(searched.data.workflows.listUsers).toEqual({
            data: {
                users: [{ id: "user-anna", displayName: "Anna Adams", teamIds: ["team-editorial"] }],
                missingIds: []
            },
            error: null
        });
        expect(byIds.data.workflows.listUsers).toEqual({
            data: {
                users: [{ id: "user-cara", displayName: "Cara Clark", teamIds: [] }],
                missingIds: ["user-gone"]
            },
            error: null
        });
        expect(api.users.calls).toHaveLength(2);
    });

    it("narrows the user list to the members of teams with teamIds (R286)", async () => {
        const api = await createApi({ permissions: EDITOR, teams: true });

        const [members] = await api.listUsers({ teamIds: ["team-editorial"] });
        const [nobody] = await api.listUsers({ teamIds: ["team-design"] });

        expect(members.data.workflows.listUsers).toEqual({
            data: {
                users: [{ id: "user-anna", displayName: "Anna Adams", teamIds: ["team-editorial"] }],
                missingIds: []
            },
            error: null
        });
        expect(nobody.data.workflows.listUsers).toEqual({
            data: { users: [], missingIds: [] },
            error: null
        });
    });

    it("returns empty team ids and no users for a team filter when teams are off (Q58, R286)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [everyone] = await api.listUsers({});
        const [scoped] = await api.listUsers({ teamIds: ["team-editorial"] });

        expect(everyone.data.workflows.listUsers).toEqual({
            data: {
                users: [
                    { id: "user-anna", displayName: "Anna Adams", teamIds: [] },
                    { id: "user-cara", displayName: "Cara Clark", teamIds: [] }
                ],
                missingIds: []
            },
            error: null
        });
        expect(scoped.data.workflows.listUsers).toEqual({
            data: { users: [], missingIds: [] },
            error: null
        });
        expect(api.users.calls).toHaveLength(1);
    });
```

The introspection test.

Before:

```ts
        expect(memberNames(types, "WorkflowsUser")).toEqual(["id", "displayName"]);
```

After:

```ts
        expect(memberNames(types, "WorkflowsUser")).toEqual(["id", "displayName"]);
        expect(memberNames(types, "WorkflowsListedUser")).toEqual([
            "id",
            "displayName",
            "teamIds"
        ]);
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. The first fails on assertions: the listed users have no `teamIds` (`expected [ { id: 'user-anna', displayName: 'Anna Adams' }, ... ] to deeply equal [ ..., teamIds: [...] ]`), and the team filter cases return the unfiltered list. The second fails because the `listUsers` query has no `teamIds` argument and `WorkflowsListedUser` does not exist (a GraphQL validation error: `Unknown argument "teamIds" on field "WorkflowsQuery.listUsers"`).

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/constants.ts`: add the flag name at the end.

Before:

```ts
/** The shared team list (R268): rows per call by default and at most; also the cap of `ids`. */
export const DEFAULT_TEAM_LIST_LIMIT = 50;
export const MAX_TEAM_LIST_LIMIT = 200;
```

After:

```ts
/** The shared team list (R268): rows per call by default and at most; also the cap of `ids`. */
export const DEFAULT_TEAM_LIST_LIMIT = 50;
export const MAX_TEAM_LIST_LIMIT = 200;

/**
 * The feature flag of teams (R287). With it off no workflows code queries teams or returns team
 * data; each request reads it again through the api-core `FeatureFlags`, never at registration.
 */
export const TEAMS_FEATURE_FLAG = "advancedAccessControlLayer.teams";
```

Modify `packages/api-workflows/src/domain/config/types.ts`: the listed user.

Before:

```ts
/** A user as the workflows configuration screens see one (D48, D104): no email, roles or teams. */
export interface WorkflowUser {
    id: string;
    displayName: string;
}

/** The shared user list (R123). `missingIds`: requested ids with no user (D117); `[]` for a search. */
export interface WorkflowUserList {
    users: WorkflowUser[];
    missingIds: string[];
}
```

After:

```ts
/**
 * A user as the workflows configuration screens list one (D48, D104, R286): no email or roles.
 * `teamIds` are the ids of the user's teams, never their names; `[]` for a user with no teams and
 * for every user while teams are off.
 */
export interface WorkflowListedUser {
    id: string;
    displayName: string;
    teamIds: string[];
}

/** The shared user list (R123). `missingIds`: requested ids with no user (D117); `[]` for a search. */
export interface WorkflowUserList {
    users: WorkflowListedUser[];
    missingIds: string[];
}
```

Modify `packages/api-workflows/src/features/config/ListWorkflowUsers/abstractions.ts`.

Before:

```ts
    /** Look these users up instead (D117), at most 200 distinct; `search` and `limit` are ignored. */
    ids?: string[] | null;
```

After:

```ts
    /**
     * Look these users up instead (D117), at most 200 distinct; `search`, `limit` and `teamIds`
     * are ignored, so a saved target who left the teams still resolves.
     */
    ids?: string[] | null;
    /**
     * Only users who are in at least one of these teams (R286). Empty matches no user. With
     * teams off a filter matches no user either. Null or absent is no filter.
     */
    teamIds?: string[] | null;
```

Before:

```ts
 * D48, D117, R123): needs `workflows.editor`. Reads users as the system (they need
 * `adminUsers.user`) and returns only id and display name. The shared `listUsers` GraphQL
 * operation calls this, never api-core directly.
```

After:

```ts
 * D48, D117, R123): needs `workflows.editor`. Reads users as the system (they need
 * `adminUsers.user`) and returns only id, display name and team ids (none while teams are off,
 * R286). The shared `listUsers` GraphQL operation calls this, never api-core directly.
```

Modify `packages/api-workflows/src/features/config/ListWorkflowUsers/index.ts`.

Before:

```ts
export type { WorkflowUser, WorkflowUserList } from "~/domain/config/types.js";
```

After:

```ts
export type { WorkflowListedUser, WorkflowUserList } from "~/domain/config/types.js";
```

Replace `packages/api-workflows/src/features/config/ListWorkflowUsers/ListWorkflowUsersUseCase.ts` in full:

```ts
import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { ListUsersInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { DEFAULT_USER_LIST_LIMIT } from "~/constants.js";
import { MAX_USER_LIST_LIMIT } from "~/constants.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";
import type { WorkflowListedUser } from "~/domain/config/types.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowUsersUseCase as UseCase } from "./abstractions.js";

/** The team ids are the user's own list, and only while teams are on (R286). */
const toListedUser = (user: AdminUser, teamsEnabled: boolean): WorkflowListedUser => {
    const teamIds: string[] = [];
    if (teamsEnabled) {
        teamIds.push(...(user.teams ?? []));
    }
    return { id: user.id, displayName: user.displayName, teamIds };
};

class ListWorkflowUsersUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface
    ) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list users" }));
        }

        const ids = input.ids ? [...new Set(input.ids)] : null;
        if (ids && ids.length === 0) {
            return Result.ok({ users: [], missingIds: [] });
        }
        // R126: counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_USER_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many user ids."));
        }

        // R287: read again on every request, never cached at registration.
        let teamsEnabled: boolean;
        try {
            teamsEnabled = this.featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG);
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }

        // R286: an ids lookup ignores the team filter. An empty filter, or a filter while teams
        // are off, matches no user, so there is nothing to look up.
        const teamIds = !ids && input.teamIds ? [...new Set(input.teamIds)] : null;
        if (teamIds && (!teamsEnabled || teamIds.length === 0)) {
            return Result.ok({ users: [], missingIds: [] });
        }

        const listInput: ListUsersInput = {};
        if (ids) {
            listInput.where = { id_in: ids };
        }
        if (teamIds) {
            listInput.where = { teams_in: teamIds };
        }

        // A membership lookup, not an access decision: `ListUsers` needs `adminUsers.user` (D48).
        let listed: Result<AdminUser[], ListUsersUseCase.Error>;
        try {
            listed = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute(listInput);
            });
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (listed.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listed.error));
        }

        if (ids) {
            const byId = new Map(listed.value.map(user => [user.id, user]));
            const users: WorkflowListedUser[] = [];
            const missingIds: string[] = [];
            for (const id of ids) {
                const user = byId.get(id);
                if (user) {
                    users.push(toListedUser(user, teamsEnabled));
                } else {
                    missingIds.push(id);
                }
            }
            return Result.ok({ users, missingIds });
        }

        // A missing or non-finite limit takes the default; others round down into 1..200 (R92).
        const requestedLimit =
            typeof input.limit === "number" && Number.isFinite(input.limit)
                ? Math.floor(input.limit)
                : DEFAULT_USER_LIST_LIMIT;
        const limit = Math.min(Math.max(requestedLimit, 1), MAX_USER_LIST_LIMIT);

        const term = input.search?.trim().toLowerCase() ?? "";
        const users = listed.value
            .filter(user => {
                if (!term) {
                    return true;
                }
                return (
                    user.displayName.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term)
                );
            })
            .sort((a, b) => {
                return a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
            })
            .slice(0, limit)
            .map(user => toListedUser(user, teamsEnabled));
        return Result.ok({ users, missingIds: [] });
    }
}

export const ListWorkflowUsersUseCase = UseCase.createImplementation({
    implementation: ListWorkflowUsersUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        FeatureFlags,
        IdentityContext,
        ListUsersUseCase
    ]
});
```

Modify `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`.

The argument types: the team filter belongs to `listUsers` only.

Before:

```ts
interface ListSearchArgs {
    search?: string | null;
    ids?: string[] | null;
    limit?: number | null;
}
```

After:

```ts
interface ListSearchArgs {
    search?: string | null;
    ids?: string[] | null;
    limit?: number | null;
}

interface ListUsersArgs extends ListSearchArgs {
    teamIds?: string[] | null;
}
```

The listed user type and the result type.

Before:

```graphql
    type WorkflowsUserListResult {
        users: [WorkflowsUser!]!
```

After:

```graphql
    "A user as the workflow editor lists one (R286): id, display name and the ids of the user's teams, which are empty while teams are off."
    type WorkflowsListedUser {
        id: ID!
        displayName: String!
        teamIds: [String!]!
    }

    type WorkflowsUserListResult {
        users: [WorkflowsListedUser!]!
```

The query field.

Before:

```graphql
        "Search by display name or email (limit 50 by default, at most 200), or look up ids (D117)."
        listUsers(search: String, ids: [String!], limit: Int): WorkflowsUserListResponse!
```

After:

```graphql
        "Search by display name or email (limit 50 by default, at most 200), narrow to the members of teams with teamIds, or look up ids (D117). An ids lookup ignores search, limit and teamIds."
        listUsers(
            search: String
            ids: [String!]
            limit: Int
            teamIds: [String!]
        ): WorkflowsUserListResponse!
```

The resolver.

Before:

```ts
        builder.addResolver<ListSearchArgs>({
            path: "WorkflowsQuery.listUsers",
            dependencies: [ListWorkflowUsersUseCase],
            resolver: (listUsers: ListWorkflowUsersUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listUsers.execute({
                        search: args.search,
                        ids: args.ids,
                        limit: args.limit
                    });
```

After:

```ts
        builder.addResolver<ListUsersArgs>({
            path: "WorkflowsQuery.listUsers",
            dependencies: [ListWorkflowUsersUseCase],
            resolver: (listUsers: ListWorkflowUsersUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listUsers.execute({
                        search: args.search,
                        ids: args.ids,
                        limit: args.limit,
                        teamIds: args.teamIds
                    });
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same two with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`ListWorkflowUsersUseCase` is registered by `WorkflowsFeature`, and `constants.ts` and `domain/config/types.ts` are shared:
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts 2>&1 | tail -50`
and the same three with `yarn test:os` (one at a time).
Expected: PASS (nothing in them changes in this task).

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): scope listUsers to teams and return team ids" -m "listUsers takes teamIds and returns each user's team ids through the new WorkflowsListedUser type. With teams off it makes no team lookup, returns empty team ids and answers a team filter with no users. An ids lookup ignores the filter. A shared test helper switches the teams flag on or off." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

## Contract notes

- The contract says "`WorkflowUser` becomes `WorkflowListedUser`" and lists `abstractions.ts` and the use case. The barrel `index.ts` also re-exports the type, so it changes too (no other file in the repository imports `WorkflowUser`).
- An empty `teamIds` is not named in the contract. The plan treats it as "matches no user" (no lookup), the set reading of "a user matches when any of the user's teams is in `teamIds`", so a step with no reviewing teams offers no members. `null` or absent is no filter.
- `ListUsersInput` is imported from `@webiny/api-core/features/users/shared/types.js` to type the lookup input without an inline object type; `ResolveReviewUserNameUseCase.ts` in `src` and the test fake already import from that path.
- The teams-on default of `createUsersContext` (and the teams-off default of `createApi`) follows R311: the user list tests that read team ids run with teams on by default, the GraphQL file keeps flags empty unless a test passes `teams`, and Task 5 switches its own tests.

## Review fixes (sub-phase review)

- No change needed. Checked: every `Before` hunk applies to the current `ListWorkflowUsersUseCase`, `abstractions.ts`, `types.ts`, `index.ts`, `constants.ts`, `WorkflowsSchemaFactory.ts` and `workflowsSchema.test.ts`; `FeatureFlags` and `FakeListUsers` behave as the helper and tests assume; the id-cap assertion that Task 3 changes matches the text written here.
