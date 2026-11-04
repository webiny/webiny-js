### Task 2: `workflows { listTeams }`

R268, R87, D132; D166 (recorded by Task 23); Q42; SEC-66 pattern (R208); Review Focus 9 (`00-shared.md`). The phase 8a and 8b Global Constraints and Rulings apply unchanged (read: never throw out of a resolver, shared resolvers check no permission themselves but the use case checks `editor`, only the team lookup and the member scan run inside `identityContext.withoutAuthorization` and never a read check, no helper wrappers around dependency calls, one class or one public function per file, one named import per line, namespace types, comments end with a period, targeted tests, the pre-commit chain, the commit trailers).

The workflow editor needs the names of the teams a step reviews with, a searchable list for the teams picker and, for the card warning `{Team} has no members.`, the number of members of each team. api-core's `ListTeamsUseCase` needs `security.team`, which a workflow editor does not have, so a shared use case wraps it, exactly as `ListWorkflowUsers` wraps `ListUsersUseCase`.

- **`ListWorkflowTeamsUseCase`** (`[AWF]/features/config/ListWorkflowTeams/`, the layout of the sibling `ListWorkflowUsers`): `abstractions.ts` (token, namespace, `ListWorkflowTeamsInput { search?: string | null; ids?: string[] | null; limit?: number | null }`), `ListWorkflowTeamsUseCase.ts` (class `ListWorkflowTeamsUseCaseImpl`, exported under the token name), `feature.ts` (`ListWorkflowTeamsFeature`), `index.ts`. Dependencies `[CurrentReviewViewer, WorkflowsPermissions, IdentityContext, ListTeamsUseCase, ListUsersUseCase]`.
- **Flow:**
  1. `viewer.getActor()`: a failed Result is returned as it is (`Workflows/NotAuthenticated`). `permissions.canEdit()` inside `try`/`catch` (a throw is a `WorkflowPersistenceError`); not `editor` is `WorkflowsNotAuthorizedError { action: "list teams" }`. Nothing is read before the gate.
  2. `ids` are de-duplicated; an empty list is `{ teams: [], missingIds: [] }` with no lookup; more than 200 distinct ids (`MAX_TEAM_LIST_LIMIT`) is `WorkflowValidationError("Too many team ids.")` (the `listUsers` rule: counted after de-duplication, no lookup).
  3. The team lookup: `identityContext.withoutAuthorization(() => listTeams.execute(...))` with `{ where: { id_in: ids } }` for an ids request, `{}` otherwise. A throw or a failed Result is a `WorkflowPersistenceError` (R87). Only this call runs without authorization (it needs `security.team`).
  4. An ids request returns the found teams in the order of the request and the ids with no team in `missingIds`; `search` and `limit` are ignored. A search request filters in memory by a case-insensitive substring of the team **name** (the slug is not searched; api-core's list has no name filter), sorts by name then id (`localeCompare`), and takes `limit` rows: 50 by default (`DEFAULT_TEAM_LIST_LIMIT`), a missing or non-finite limit takes the default, others round down into 1..200 (`MAX_TEAM_LIST_LIMIT`). `missingIds` is `[]` for a search.
  5. **`memberCount`**: when at least one team is returned, one `ListUsersUseCase.execute({ where: { teams_in: <returned team ids> } })` inside `withoutAuthorization` (the same scan `StoreWorkflowUseCase` makes per user target; both storages load the tenant's users and filter in memory), then one pass over the users counts, for each returned team, the users whose `teams` contain it. A user in two returned teams counts for both; a team with no user is `0`. With no returned team there is no user lookup. A throw or a failed Result is a `WorkflowPersistenceError` and the whole call fails (never a partial list with wrong zeros). This scan is a planner extension of Q42 and exposes only a number.
  6. The result is `{ teams: [{ id, name, memberCount }], missingIds }`. Nothing else of the team (slug, description, roles, plugin flag) and nothing of a user leaves the use case.
- **Constants** (`[AWF]/constants.ts`, next to the user ones): `DEFAULT_TEAM_LIST_LIMIT = 50`, `MAX_TEAM_LIST_LIMIT = 200`.
- **Domain types** (`[AWF]/domain/config/types.ts`): `WorkflowTeamSummary { id: string; name: string; memberCount: number }`, `WorkflowTeamList { teams: WorkflowTeamSummary[]; missingIds: string[] }`.
- **GraphQL** (`[AWF]/graphql/WorkflowsSchemaFactory.ts`, shared types and the `workflows` root): `type WorkflowsTeamSummary { id: ID! name: String! memberCount: Int! }` (new; `WorkflowsTeam`, used by the review's `candidateTeams`, stays `{ id, name }`), `type WorkflowsTeamListResult { teams: [WorkflowsTeamSummary!]! missingIds: [String!]! }`, `type WorkflowsTeamListResponse { data: WorkflowsTeamListResult error: WorkflowsError }`, and `WorkflowsQuery.listTeams(search: String, ids: [String!], limit: Int): WorkflowsTeamListResponse!`, resolved by the use case with the Result pattern (`ErrorResponse` / `Response`), like `listUsers`.
- **Registration**: `ListWorkflowTeamsFeature.register(container)` in `[AWF]/WorkflowsFeature.ts` next to `ListWorkflowUsersFeature`.

**Files:**
- Create: `packages/api-workflows/src/features/config/ListWorkflowTeams/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowTeams/ListWorkflowTeamsUseCase.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowTeams/feature.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowTeams/index.ts`
- Modify: `packages/api-workflows/src/constants.ts`
- Modify: `packages/api-workflows/src/domain/config/types.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeListTeams.ts`
- Create: `packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `ListTeamsUseCase` (`@webiny/api-core/features/security/teams/ListTeams/index.js`; `execute(params?: ListTeamsInput): Promise<Result<Team[], ListTeamsUseCase.Error>>`, needs `security.team`, `ListTeamsInput { where?: { id_in?, slug_in? }, sort? }`, `ListTeamsInput` from `@webiny/api-core/features/security/teams/shared/types.js`), `Team` (`@webiny/api-core/types/security.js`: `id`, `name`, `slug`, `description`, `system`, `roles`, `createdOn`, `createdBy`, optional `plugin`), `TeamStorageError` (`@webiny/api-core/features/security/teams/shared/errors.js`), `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`; `where.teams_in`), `AdminUser` (`@webiny/api-core/types/users.js`; `teams?: string[]`), `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`; `withoutAuthorization`, `isAuthorizationEnabled`), `CurrentReviewViewer`, `WorkflowsPermissions`, `WorkflowsNotAuthorizedError`, `WorkflowPersistenceError`, `WorkflowValidationError`, `Result`, `createAbstraction`, `createFeature`. Test helpers: `createContextHandler` (`~tests/__helpers/handler.js`), `expectOk`, `OTHER_TEAM_ID`, `REVIEW_TEAM_ID` (`~tests/__helpers/fixtures.js`), `FakeListUsers`, `FakeUser` (`~tests/__helpers/FakeListUsers.js`).
- Produces (matches the contract): `ListWorkflowTeamsUseCase.execute(input?: ListWorkflowTeamsInput): Promise<Result<WorkflowTeamList, WorkflowsNotAuthenticatedError | WorkflowsNotAuthorizedError | WorkflowValidationError | WorkflowPersistenceError>>`, namespace `ListWorkflowTeamsUseCase.Interface`, `.Input`, `.Error`, `.Return`; `ListWorkflowTeamsInput`; `WorkflowTeamSummary`, `WorkflowTeamList`; `ListWorkflowTeamsFeature`; the GraphQL types and `WorkflowsQuery.listTeams` above; the test helper `FakeListTeams` (`__tests__/__helpers/FakeListTeams.ts`). Consumed by Task 5 (the config gateway document and DTO), Task 9 (the team map of a loaded workflow), Task 11 (the teams picker).

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeListTeams.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ListTeamsInput } from "@webiny/api-core/features/security/teams/shared/types.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import type { Team } from "@webiny/api-core/types/security.js";

export interface FakeTeam {
    id: string;
    name: string;
}

export interface ListTeamsCall {
    input: ListTeamsInput;
    /** Whether authorization was on during the call; `null` before `watch`. */
    authorizationEnabled: boolean | null;
}

/**
 * Teams from a fixed list, filtered by `id_in` like api-core does. Every team carries a slug, a
 * description and a role that the workflows list must never return. Records every call and fails
 * the next `failuresLeft` calls with a storage error. Register with
 * `container.registerInstance(ListTeamsUseCase, fake)` and call `watch` once the context exists.
 */
export class FakeListTeams implements ListTeamsUseCase.Interface {
    public readonly calls: ListTeamsCall[] = [];
    public failuresLeft = 0;
    private identityContext: IdentityContext.Interface | null = null;

    public constructor(private teams: FakeTeam[]) {}

    public watch(identityContext: IdentityContext.Interface): void {
        this.identityContext = identityContext;
    }

    public async execute(
        input: ListTeamsInput = {}
    ): Promise<Result<Team[], ListTeamsUseCase.Error>> {
        this.calls.push({
            input: structuredClone(input),
            authorizationEnabled: this.identityContext
                ? this.identityContext.isAuthorizationEnabled()
                : null
        });
        if (this.failuresLeft > 0) {
            this.failuresLeft -= 1;
            return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
        }
        const where = input.where ?? {};
        const teams = this.teams.filter(team => {
            return !where.id_in || where.id_in.includes(team.id);
        });
        return Result.ok(
            teams.map(team => ({
                id: team.id,
                name: team.name,
                slug: `${team.id}-slug`,
                description: "Secret description",
                system: false,
                roles: ["role-secret"],
                createdOn: "2026-10-01T00:00:00.000Z",
                createdBy: null
            }))
        );
    }
}
```

Create `packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { FakeListTeams, type FakeTeam } from "~tests/__helpers/FakeListTeams.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowTeamsUseCase } from "~/features/config/ListWorkflowTeams/index.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];
const REASSIGNER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

const TEAMS: FakeTeam[] = [
    { id: "team-finance", name: "Finance" },
    { id: "team-design", name: "design" },
    { id: "team-editorial", name: "Editorial" },
    { id: "team-empty", name: "Empty team" }
];

/** Anna is in two teams, Bob in one, Cara in none; nobody is in `team-empty`. */
const USERS: FakeUser[] = [
    { id: "user-anna", displayName: "Anna Adams", teams: ["team-editorial", "team-design"] },
    { id: "user-bob", displayName: "bob Brown", teams: ["team-editorial"] },
    { id: "user-cara", displayName: "Cara Clark", teams: [] }
];

/** Every team lookup throws, as a crashed storage driver does. */
class ThrowingListTeams implements ListTeamsUseCase.Interface {
    public async execute(): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        throw new Error("Teams are down.");
    }
}

/** Every user lookup throws, as a crashed storage driver does. */
class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): ReturnType<ListUsersUseCase.Interface["execute"]> {
        throw new Error("Users are down.");
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface TeamsContextParams extends CmsTestHandlerParams {
    teams?: FakeTeam[];
    listTeams?: ListTeamsUseCase.Interface;
    listUsers?: ListUsersUseCase.Interface;
}

const createTeamsContext = async (params: TeamsContextParams = {}) => {
    const teams = new FakeListTeams(params.teams ?? TEAMS);
    const users = new FakeListUsers(USERS);
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListTeamsUseCase, params.listTeams ?? teams);
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
            await params.setup?.(container);
        }
    });
    const identityContext = context.container.resolve(IdentityContext);
    teams.watch(identityContext);
    users.watch(identityContext);
    return {
        container: context.container,
        teams,
        users,
        listTeams: context.container.resolve(ListWorkflowTeamsUseCase)
    };
};

describe("ListWorkflowTeamsUseCase (Q42, R268)", () => {
    it("lists every team as id, name and member count, sorted by name, without authorization", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute());

        expect(list).toEqual({
            teams: [
                { id: "team-design", name: "design", memberCount: 1 },
                { id: "team-editorial", name: "Editorial", memberCount: 2 },
                { id: "team-empty", name: "Empty team", memberCount: 0 },
                { id: "team-finance", name: "Finance", memberCount: 0 }
            ],
            missingIds: []
        });
        expect(teams.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
        expect(users.calls).toEqual([
            {
                input: {
                    where: {
                        teams_in: ["team-design", "team-editorial", "team-empty", "team-finance"]
                    }
                },
                authorizationEnabled: false
            }
        ]);
    });

    it("returns only id, name and member count of a team", async () => {
        const { listTeams } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ limit: 1 }));

        expect(Object.keys(list).sort()).toEqual(["missingIds", "teams"]);
        expect(Object.keys(list.teams[0]).sort()).toEqual(["id", "memberCount", "name"]);
        expect(JSON.stringify(list)).not.toContain("Secret description");
        expect(JSON.stringify(list)).not.toContain("role-secret");
        expect(JSON.stringify(list)).not.toContain("-slug");
    });

    it("searches the team name, case-insensitively, and not the slug", async () => {
        const { listTeams } = await createTeamsContext({ permissions: EDITOR });

        const byName = expectOk(await listTeams.execute({ search: "  EDIT " }));
        const bySlug = expectOk(await listTeams.execute({ search: "finance-slug" }));
        const blank = expectOk(await listTeams.execute({ search: "   " }));

        expect(byName.teams.map(team => team.id)).toEqual(["team-editorial"]);
        expect(bySlug.teams).toEqual([]);
        expect(blank.teams).toHaveLength(4);
        expect(byName.missingIds).toEqual([]);
    });

    it("counts the members of the returned teams only, with one user lookup", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ search: "design" }));

        expect(list.teams).toEqual([{ id: "team-design", name: "design", memberCount: 1 }]);
        expect(users.calls).toEqual([
            { input: { where: { teams_in: ["team-design"] } }, authorizationEnabled: false }
        ]);
    });

    it("does not look users up when no team is returned", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ search: "nothing like this" }));

        expect(list).toEqual({ teams: [], missingIds: [] });
        expect(users.calls).toEqual([]);
    });

    it("returns 50 teams by default, at most 200 and at least 1 (R268)", async () => {
        const many = Array.from({ length: 205 }, (_, index): FakeTeam => {
            const number = String(index).padStart(3, "0");
            return { id: `team-${number}`, name: `Team ${number}` };
        });
        const { listTeams, users } = await createTeamsContext({
            permissions: EDITOR,
            teams: many
        });

        const byDefault = expectOk(await listTeams.execute());
        const tooMany = expectOk(await listTeams.execute({ limit: 500 }));
        const tooFew = expectOk(await listTeams.execute({ limit: 0 }));
        const fraction = expectOk(await listTeams.execute({ limit: 2.7 }));
        const notFinite = expectOk(await listTeams.execute({ limit: Number.NaN }));

        expect(byDefault.teams).toHaveLength(50);
        expect(byDefault.teams[0]).toEqual({ id: "team-000", name: "Team 000", memberCount: 0 });
        expect(tooMany.teams).toHaveLength(200);
        expect(tooFew.teams).toEqual([{ id: "team-000", name: "Team 000", memberCount: 0 }]);
        expect(fraction.teams).toHaveLength(2);
        expect(notFinite.teams).toHaveLength(50);
        // The member scan only asks about the rows that are returned.
        expect(users.calls[0].input.where?.teams_in).toHaveLength(50);
    });

    it("resolves ids in the given order and reports the missing ones", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(
            await listTeams.execute({
                ids: ["team-editorial", "team-gone", "team-design", "team-editorial"],
                search: "nobody",
                limit: 1
            })
        );

        expect(list).toEqual({
            teams: [
                { id: "team-editorial", name: "Editorial", memberCount: 2 },
                { id: "team-design", name: "design", memberCount: 1 }
            ],
            missingIds: ["team-gone"]
        });
        expect(teams.calls).toEqual([
            {
                input: { where: { id_in: ["team-editorial", "team-gone", "team-design"] } },
                authorizationEnabled: false
            }
        ]);
        expect(users.calls).toEqual([
            {
                input: { where: { teams_in: ["team-editorial", "team-design"] } },
                authorizationEnabled: false
            }
        ]);
    });

    it("reports every id as missing without a user lookup when no team exists", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ ids: ["team-gone", "team-lost"] }));

        expect(list).toEqual({ teams: [], missingIds: ["team-gone", "team-lost"] });
        expect(users.calls).toEqual([]);
    });

    it("refuses more than 200 ids without a lookup", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });
        const ids = Array.from({ length: 201 }, (_, index) => `team-${index}`);

        const result = await listTeams.execute({ ids });
        // Counted after de-duplication: 200 distinct ids plus repeats are allowed.
        const deduplicated = await listTeams.execute({ ids: [...ids.slice(0, 200), "team-0"] });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many team ids.");
        expect(deduplicated.isOk()).toBe(true);
        expect(teams.calls).toHaveLength(1);
        expect(users.calls).toEqual([]);
    });

    it("answers an empty ids list without a lookup", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });

        const list = expectOk(await listTeams.execute({ ids: [] }));

        expect(list).toEqual({ teams: [], missingIds: [] });
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("allows a full-access permission set", async () => {
        const { listTeams } = await createTeamsContext({
            permissions: [{ name: "workflows.*" }]
        });

        const list = await listTeams.execute();

        expect(list.isOk()).toBe(true);
    });

    it("refuses a user without editor and reads nothing", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: REASSIGNER });

        const result = await listTeams.execute({ search: "fin" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list teams" });
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("refuses an anonymous identity and reads nothing", async () => {
        const { container, listTeams, teams, users } = await createTeamsContext();
        const identityContext = container.resolve(IdentityContext);

        const result = await identityContext.withIdentity(new AnonymousIdentity(), () =>
            listTeams.execute()
        );

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("returns the persistence error when the team lookup fails (R87)", async () => {
        const { listTeams, teams, users } = await createTeamsContext({ permissions: EDITOR });
        teams.failuresLeft = 1;

        const failed = await listTeams.execute();

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
        expect(users.calls).toEqual([]);
    });

    it("returns the persistence error when the team lookup throws (R87)", async () => {
        const { listTeams } = await createTeamsContext({
            permissions: EDITOR,
            listTeams: new ThrowingListTeams()
        });

        const thrown = await listTeams.execute({ ids: ["team-design"] });

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Teams are down.");
    });

    it("returns the persistence error, not a list of zeros, when the member scan fails (R87)", async () => {
        const { listTeams, users } = await createTeamsContext({ permissions: EDITOR });
        users.failuresLeft = 1;

        const failed = await listTeams.execute();

        expect(failed.isFail()).toBe(true);
        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
    });

    it("returns the persistence error when the member scan throws (R87)", async () => {
        const { listTeams } = await createTeamsContext({
            permissions: EDITOR,
            listUsers: new ThrowingListUsers()
        });

        const thrown = await listTeams.execute();

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Users are down.");
    });

    it("returns the persistence error when the permission check throws (R87)", async () => {
        const { listTeams, teams } = await createTeamsContext({
            setup: container => {
                container.registerInstance(WorkflowsPermissions, {
                    isFullAccess: throwing,
                    canEdit: throwing,
                    canReassign: throwing,
                    getPermissionSet: throwing
                });
            }
        });

        const result = await listTeams.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Permissions are down.");
        expect(teams.calls).toEqual([]);
    });
});
```

Modify `packages/api-workflows/__tests__/registration.test.ts`.

Before:

```ts
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
```

After:

```ts
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
import { ListWorkflowTeamsUseCase } from "~/features/config/ListWorkflowTeams/index.js";
```

Before:

```ts
        expect(container.resolveAll(ListWorkflowUsersUseCase)).toHaveLength(1);
```

After:

```ts
        expect(container.resolveAll(ListWorkflowUsersUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowTeamsUseCase)).toHaveLength(1);
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (the root test: the query, the schema shape, the license-free paths). Imports and fixtures.

Before:

```ts
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
```

After:

```ts
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import { FakeListTeams, type FakeTeam } from "~tests/__helpers/FakeListTeams.js";
```

Before:

```ts
const API_USERS: FakeUser[] = [
    { id: "user-cara", displayName: "Cara Clark", teams: [] },
    { id: "user-anna", displayName: "Anna Adams", teams: [] }
];
```

After:

```ts
const API_USERS: FakeUser[] = [
    { id: "user-cara", displayName: "Cara Clark", teams: [] },
    { id: "user-anna", displayName: "Anna Adams", teams: ["team-editorial"] }
];

const API_TEAMS: FakeTeam[] = [
    { id: "team-editorial", name: "Editorial" },
    { id: "team-design", name: "design" }
];
```

Before:

```ts
const LIST_USERS = /* GraphQL */ `
```

After:

```ts
const LIST_TEAMS = /* GraphQL */ `
    query ListTeams($search: String, $ids: [String!], $limit: Int) {
        workflows {
            listTeams(search: $search, ids: $ids, limit: $limit) {
                data {
                    teams {
                        id
                        name
                        memberCount
                    }
                    missingIds
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;

const LIST_USERS = /* GraphQL */ `
```

Before:

```ts
interface GetSettingsResult {
    getSettings: SettingsEnvelope;
}
```

After:

```ts
interface TeamRow {
    id: string;
    name: string;
    memberCount: number;
}

interface TeamListRow {
    teams: TeamRow[];
    missingIds: string[];
}

interface TeamListEnvelope {
    data: TeamListRow | null;
    error: ErrorRow | null;
}

interface ListTeamsResult {
    listTeams: TeamListEnvelope;
}

interface GetSettingsResult {
    getSettings: SettingsEnvelope;
}
```

Before:

```ts
    const users = new FakeListUsers(API_USERS);
    // The use case test pins the `withoutAuthorization` wrap; here only the calls are counted.
    const { createQuery, createMutation } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, users);
            await params.setup?.(container);
        }
    });
    return {
        users,
```

After:

```ts
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
    return {
        users,
        teams,
```

Before:

```ts
        listUsers: createQuery<GraphQLBody<WorkflowsRoot<ListUsersResult>>>(LIST_USERS)
    };
```

After:

```ts
        listUsers: createQuery<GraphQLBody<WorkflowsRoot<ListUsersResult>>>(LIST_USERS),
        listTeams: createQuery<GraphQLBody<WorkflowsRoot<ListTeamsResult>>>(LIST_TEAMS)
    };
```

New root tests, after the `refuses the user list to a user without editor` test.

Before:

```ts
    it("exposes the shared types the app schemas reuse (R100)", async () => {
```

After:

```ts
    it("lists teams with their member count for an editor, by search and by ids (Q42, R268)", async () => {
        const api = await createApi({ permissions: EDITOR });

        const [searched] = await api.listTeams({ search: "EDIT" });
        const [byIds] = await api.listTeams({ ids: ["team-design", "team-gone"] });

        expect(searched.data.workflows.listTeams).toEqual({
            data: {
                teams: [{ id: "team-editorial", name: "Editorial", memberCount: 1 }],
                missingIds: []
            },
            error: null
        });
        expect(byIds.data.workflows.listTeams).toEqual({
            data: {
                teams: [{ id: "team-design", name: "design", memberCount: 0 }],
                missingIds: ["team-gone"]
            },
            error: null
        });
        expect(api.teams.calls).toHaveLength(2);
    });

    it("refuses the team list to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listTeams({ limit: 10 });

        expect(response.data.workflows.listTeams).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list teams.",
                data: { action: "list teams" }
            }
        });
        expect(api.teams.calls).toEqual([]);
        expect(api.users.calls).toEqual([]);
    });

    it("answers more than 200 team ids with the validation error", async () => {
        const api = await createApi({ permissions: EDITOR });
        const ids = Array.from({ length: 201 }, (_, index) => `team-${index}`);

        const [response] = await api.listTeams({ ids });

        const result = response.data.workflows.listTeams;
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe("Workflows/Workflow/Validation");
        expect(result.error?.message).toBe("Too many team ids.");
        expect(api.teams.calls).toEqual([]);
    });

    it("exposes the shared types the app schemas reuse (R100)", async () => {
```

Before:

```ts
            "listNotificationTransports",
            "listUsers"
        ]);
```

After:

```ts
            "listNotificationTransports",
            "listUsers",
            "listTeams"
        ]);
```

Before:

```ts
        expect(memberNames(types, "WorkflowsUserListResponse")).toEqual(["data", "error"]);
```

After:

```ts
        expect(memberNames(types, "WorkflowsUserListResponse")).toEqual(["data", "error"]);
        expect(memberNames(types, "WorkflowsTeamSummary")).toEqual(["id", "name", "memberCount"]);
        expect(memberNames(types, "WorkflowsTeamListResult")).toEqual(["teams", "missingIds"]);
        expect(memberNames(types, "WorkflowsTeamListResponse")).toEqual(["data", "error"]);
```

(`WorkflowsTeam` keeps its two members: the existing line `expect(memberNames(types, "WorkflowsTeam")).toEqual(["id", "name"])` stays and proves the review's `candidateTeams` type is untouched. The `WorkflowsQuery` order in the Before block above is the one the file has today: `getSettings`, `listStepTypes`, `listAutomationDefinitions`, `listAiTools`, `listNotificationTransports`, `listUsers`.)

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The use case test and the registration test fail to load `~/features/config/ListWorkflowTeams/index.js`, which does not exist. The schema test fails: the `listTeams` operations answer a GraphQL error (`Cannot query field "listTeams" on type "WorkflowsQuery"`) and the member lists differ (`expected [...] to deeply equal [..., "listTeams"]`).

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/constants.ts`.

Before:

```ts
export const DEFAULT_USER_LIST_LIMIT = 50;
export const MAX_USER_LIST_LIMIT = 200;
```

After:

```ts
export const DEFAULT_USER_LIST_LIMIT = 50;
export const MAX_USER_LIST_LIMIT = 200;

/** The shared team list (R268): rows per call by default and at most; also the cap of `ids`. */
export const DEFAULT_TEAM_LIST_LIMIT = 50;
export const MAX_TEAM_LIST_LIMIT = 200;
```

Modify `packages/api-workflows/src/domain/config/types.ts`: add the types after `WorkflowUserList`.

Before:

```ts
export interface WorkflowUserList {
    users: WorkflowUser[];
    missingIds: string[];
}
```

After:

```ts
export interface WorkflowUserList {
    users: WorkflowUser[];
    missingIds: string[];
}

/**
 * A team as the workflow editor lists one (R268): no slug, description or roles. `memberCount` is
 * the number of admin users in the team, so the editor can warn about a team with no members.
 */
export interface WorkflowTeamSummary {
    id: string;
    name: string;
    memberCount: number;
}

/** The shared team list (R268). `missingIds`: requested ids with no team; `[]` for a search. */
export interface WorkflowTeamList {
    teams: WorkflowTeamSummary[];
    missingIds: string[];
}
```

Create `packages/api-workflows/src/features/config/ListWorkflowTeams/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowTeamList } from "~/domain/config/types.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface ListWorkflowTeamsInput {
    /** Case-insensitive substring of the team name; blank lists every team. */
    search?: string | null;
    /** Look these teams up instead, at most 200 distinct; `search` and `limit` are ignored. */
    ids?: string[] | null;
    /** Rows of a search: 50 by default, 1..200. */
    limit?: number | null;
}

export interface IListWorkflowTeamsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowTeamsUseCaseErrors[keyof IListWorkflowTeamsUseCaseErrors];

export interface IListWorkflowTeamsUseCase {
    execute(input?: ListWorkflowTeamsInput): Promise<Result<WorkflowTeamList, UseCaseError>>;
}

/**
 * The tenant's teams for the workflow editor (Q42, R268): needs `workflows.editor`. Reads the
 * teams and the users' team memberships as the system (they need `security.team` and
 * `adminUsers.user`) and returns only id, name and member count. The shared `listTeams` GraphQL
 * operation calls this, never api-core directly.
 */
export const ListWorkflowTeamsUseCase = createAbstraction<IListWorkflowTeamsUseCase>(
    "ListWorkflowTeamsUseCase"
);

export namespace ListWorkflowTeamsUseCase {
    export type Interface = IListWorkflowTeamsUseCase;
    export type Input = ListWorkflowTeamsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowTeamList, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/ListWorkflowTeams/ListWorkflowTeamsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { Team } from "@webiny/api-core/types/security.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { DEFAULT_TEAM_LIST_LIMIT, MAX_TEAM_LIST_LIMIT } from "~/constants.js";
import type { WorkflowTeamSummary } from "~/domain/config/types.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowTeamsUseCase as UseCase } from "./abstractions.js";

const compareTeams = (a: Team, b: Team): number => {
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
};

/** Counts, for each team, the users whose `teams` contain it. A team with no user is 0. */
const toWorkflowTeams = (teams: Team[], users: AdminUser[]): WorkflowTeamSummary[] => {
    const counts = new Map<string, number>();
    for (const team of teams) {
        counts.set(team.id, 0);
    }
    for (const user of users) {
        for (const teamId of user.teams ?? []) {
            const count = counts.get(teamId);
            if (count !== undefined) {
                counts.set(teamId, count + 1);
            }
        }
    }
    return teams.map(team => {
        return { id: team.id, name: team.name, memberCount: counts.get(team.id) ?? 0 };
    });
};

class ListWorkflowTeamsUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private listTeams: ListTeamsUseCase.Interface,
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
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list teams" }));
        }

        const ids = input.ids ? [...new Set(input.ids)] : null;
        if (ids && ids.length === 0) {
            return Result.ok({ teams: [], missingIds: [] });
        }
        // Counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_TEAM_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many team ids."));
        }

        // A name lookup, not an access decision: `ListTeams` needs `security.team` (SEC-66).
        let listedTeams: Result<Team[], ListTeamsUseCase.Error>;
        try {
            listedTeams = await this.identityContext.withoutAuthorization(() => {
                return this.listTeams.execute(ids ? { where: { id_in: ids } } : {});
            });
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (listedTeams.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listedTeams.error));
        }

        const teams: Team[] = [];
        const missingIds: string[] = [];
        if (ids) {
            const byId = new Map(listedTeams.value.map(team => [team.id, team]));
            for (const id of ids) {
                const team = byId.get(id);
                if (team) {
                    teams.push(team);
                } else {
                    missingIds.push(id);
                }
            }
        } else {
            // A missing or non-finite limit takes the default; others round down into 1..200.
            const requestedLimit =
                typeof input.limit === "number" && Number.isFinite(input.limit)
                    ? Math.floor(input.limit)
                    : DEFAULT_TEAM_LIST_LIMIT;
            const limit = Math.min(Math.max(requestedLimit, 1), MAX_TEAM_LIST_LIMIT);

            const term = input.search?.trim().toLowerCase() ?? "";
            const found = listedTeams.value
                .filter(team => !term || team.name.toLowerCase().includes(term))
                .sort(compareTeams)
                .slice(0, limit);
            teams.push(...found);
        }

        if (teams.length === 0) {
            return Result.ok({ teams: [], missingIds });
        }

        // The member count: one scan of the tenant's users, which carry their team ids. A
        // membership count, not an access decision: `ListUsers` needs `adminUsers.user`.
        const teamIds = teams.map(team => team.id);
        let listedUsers: Result<AdminUser[], ListUsersUseCase.Error>;
        try {
            listedUsers = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute({ where: { teams_in: teamIds } });
            });
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (listedUsers.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listedUsers.error));
        }

        return Result.ok({ teams: toWorkflowTeams(teams, listedUsers.value), missingIds });
    }
}

export const ListWorkflowTeamsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowTeamsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        IdentityContext,
        ListTeamsUseCase,
        ListUsersUseCase
    ]
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowTeams/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowTeamsUseCase } from "./ListWorkflowTeamsUseCase.js";

export const ListWorkflowTeamsFeature = createFeature({
    name: "Workflows/ListWorkflowTeams",
    register(container) {
        container.register(ListWorkflowTeamsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowTeams/index.ts`:

```ts
export { ListWorkflowTeamsUseCase } from "./abstractions.js";
export type { ListWorkflowTeamsInput } from "./abstractions.js";
export type { WorkflowTeamList, WorkflowTeamSummary } from "~/domain/config/types.js";
```

Modify `packages/api-workflows/src/WorkflowsFeature.ts`.

Before:

```ts
import { ListWorkflowUsersFeature } from "~/features/config/ListWorkflowUsers/feature.js";
```

After:

```ts
import { ListWorkflowUsersFeature } from "~/features/config/ListWorkflowUsers/feature.js";
import { ListWorkflowTeamsFeature } from "~/features/config/ListWorkflowTeams/feature.js";
```

Before:

```ts
        ListWorkflowUsersFeature.register(container);
```

After:

```ts
        ListWorkflowUsersFeature.register(container);
        ListWorkflowTeamsFeature.register(container);
```

Modify `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`.

Before:

```ts
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
```

After:

```ts
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
import { ListWorkflowTeamsUseCase } from "~/features/config/ListWorkflowTeams/index.js";
```

Before:

```ts
interface ListUsersArgs {
    search?: string | null;
    ids?: string[] | null;
    limit?: number | null;
}
```

After (the shape is shared by `listUsers` and `listTeams`, so the one interface is renamed instead of duplicated):

```ts
interface ListSearchArgs {
    search?: string | null;
    ids?: string[] | null;
    limit?: number | null;
}
```

Before:

```ts
        builder.addResolver<ListUsersArgs>({
```

After:

```ts
        builder.addResolver<ListSearchArgs>({
```

Before:

```ts
    type WorkflowsUserListResponse {
        data: WorkflowsUserListResult
        error: WorkflowsError
    }
```

After:

```ts
    type WorkflowsUserListResponse {
        data: WorkflowsUserListResult
        error: WorkflowsError
    }

    "A team as the workflow editor lists one (R268): id, name and the number of admin users in it."
    type WorkflowsTeamSummary {
        id: ID!
        name: String!
        memberCount: Int!
    }

    type WorkflowsTeamListResult {
        teams: [WorkflowsTeamSummary!]!
        "Requested ids with no team; empty for a search."
        missingIds: [String!]!
    }

    type WorkflowsTeamListResponse {
        data: WorkflowsTeamListResult
        error: WorkflowsError
    }
```

Before:

```ts
        listUsers(search: String, ids: [String!], limit: Int): WorkflowsUserListResponse!
    }
```

After:

```ts
        listUsers(search: String, ids: [String!], limit: Int): WorkflowsUserListResponse!
        "Search by team name (limit 50 by default, at most 200), or look up at most 200 ids."
        listTeams(search: String, ids: [String!], limit: Int): WorkflowsTeamListResponse!
    }
```

Before:

```ts
        builder.addResolver<UpdateSettingsArgs>({
            path: "WorkflowsMutation.updateSettings",
```

After:

```ts
        builder.addResolver<ListSearchArgs>({
            path: "WorkflowsQuery.listTeams",
            dependencies: [ListWorkflowTeamsUseCase],
            resolver: (listTeams: ListWorkflowTeamsUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listTeams.execute({
                        search: args.search,
                        ids: args.ids,
                        limit: args.limit
                    });
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<UpdateSettingsArgs>({
            path: "WorkflowsMutation.updateSettings",
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS for each.

Run the same three with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`WorkflowsSchemaFactory.ts`, `WorkflowsFeature.ts` and `constants.ts` are shared, so run the tests that build the whole container or the `workflows` root, each on its own with `yarn test <path> 2>&1 | tail -50` and again with `yarn test:os`:
`packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts`
`packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts`
`packages/api-workflows/__tests__/graphql/workflowsReviewTeams.test.ts`
`packages/api-workflows/__tests__/review/ListReviewCandidateTeams.test.ts`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors. (If `result.error.data` or `result.error.code` of a union Result does not type-check in the new test, the file follows `ListWorkflowUsers.test.ts`, which reads them the same way. If `list.teams[0]` is flagged as possibly undefined under `noUncheckedIndexedAccess`, read it through `const [first] = list.teams;` and assert `first` is defined first.)

Build the package so the admin tasks of 9a can rely on the new type document: `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`.
Expected: clean.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit (replace `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit):

```
git commit -m "feat(api-workflows): add the shared team list query" -m "workflows.listTeams returns id, name and member count of the tenant's teams for the workflow editor, by name search or by ids, gated on the editor permission. Only the team lookup and the member scan run without authorization." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

## Contract notes

- The contract's file list names `constants` without a path: the constants go in `packages/api-workflows/src/constants.ts` next to `DEFAULT_USER_LIST_LIMIT` and `MAX_USER_LIST_LIMIT` (contract review 2 M6 asked for them by name). The domain types go in the existing `[AWF]/domain/config/types.ts`, as `WorkflowUser` and `WorkflowUserList` do.
- The contract's SDL type is `WorkflowsTeamSummary`; the domain type is named `WorkflowTeamSummary` (no `s`), after `WorkflowUser`. Task 5 maps the first to its own `WorkflowTeamSummary` DTO and domain type; the names do not collide because they live in different packages.
- R268 says "sorted by name". Sorting is done for a search. An ids request keeps the order of the request (the `listUsers` rule), because the presenter of Task 9 puts the result in a map and the picker's `selected` list should follow the stored order of `config.teams`.
- The member scan asks `ListUsersUseCase` with `where.teams_in` limited to the returned team ids. api-core's storages (`api-core-ddb/src/adminUsers/index.ts`, `api-core-sql/src/adminUsers/index.ts`) load every tenant user and filter in memory, so the cost is one tenant scan per request whatever the filter says; the filter keeps the fake and a future indexed storage honest. If the scan fails the call fails (no partial zeros).
- Plugin-defined teams: `TeamsRepository.list` (api-core `features/security/teams/shared/TeamsRepository.ts`) merges the plugin teams and applies `id_in` to them, so an ids request returns them on both storages (checked in review).
- The `Team.name` search ignores the slug on purpose (R268 says name filter); `FakeListTeams` gives every team a slug that does not occur in any name, so the test proves it.
