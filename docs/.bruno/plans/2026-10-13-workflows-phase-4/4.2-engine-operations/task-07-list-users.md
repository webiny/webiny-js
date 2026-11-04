### Task 7: `ListWorkflowUsersUseCase` and `workflows.listUsers`

Spec 10 ("Shared configuration operations": `listUsers`), 13.2; D48, D104, D117, D118, D133 point 2; R87, R92 (limit guard), R97, R100, R123, R126, R129; A48. The workflow editor, the settings page and the request dialog need one user list: a shared configuration use case in `packages/api-workflows/src/features/config/` behind `editor`, exposed as `workflows.listUsers` on `/graphql`.

- `ListWorkflowUsersUseCase.execute({ search?, ids?, limit? })`: the current identity as an actor first (`Workflows/NotAuthenticated`), then `WorkflowsPermissions.canEdit()` (a throw is `Workflows/Workflow/Persistence`, as `ListWorkflowStepTypesUseCase`; `false` is `Workflows/NotAuthorized` with action `"list users"`), then api-core `ListUsersUseCase` inside `IdentityContext.withoutAuthorization` (only that call; it needs `adminUsers.user`, D48). A failed or throwing lookup is `Workflows/Workflow/Persistence` (R87).
- `ids` given (D117): one lookup with `where: { id_in }` (ids de-duplicated, input order kept); the users found, in `ids` order, and `missingIds` (ids not returned, in input order). `search` and `limit` are ignored. An empty `ids` list answers `{ users: [], missingIds: [] }` without a lookup. More than 200 ids, counted after de-duplication (the number the lookup would ask for), is `Workflows/Workflow/Validation` "Too many user ids." without a lookup (R126).
- Otherwise: every user of the tenant (A48), filtered by `search` (trimmed, case-insensitive substring of `displayName` or `email`; blank = no filter), sorted by `displayName` (then `id`), at most `limit` rows. `limit`: missing or not finite → 50; otherwise rounded down and clamped into 1..200 (R92). `missingIds` is `[]`.
- Users are `{ id, displayName }` only: no email, roles or teams leave the API (D104).

The same task adds the shared GraphQL types 4.3 and 4.4 reuse for step candidates (R120) and the routing inspector (R121, R129): `WorkflowsUser`, `WorkflowsStepCandidate`, `WorkflowsRoutingTraceOutcome`, `WorkflowsRoutingTraceEntry`, `WorkflowsRoutingSkip`, `WorkflowsRoutingInspection` (R100: shared types live in `SHARED_TYPE_DEFS`; the app factories add their own `{ data, error }` envelopes and root fields).

Tests use 4.1 Task 2's `FakeListUsers`, which records whether authorization was enabled on every lookup, so the `withoutAuthorization` wrap is pinned.

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Modify: `packages/api-workflows/src/domain/config/types.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowUsers/abstractions.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowUsers/ListWorkflowUsersUseCase.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowUsers/feature.ts`
- Create: `packages/api-workflows/src/features/config/ListWorkflowUsers/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Create: `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - api-core: `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`), `execute(input?: ListUsersInput): Promise<Result<AdminUser[], ListUsersUseCase.Error>>`, `ListUsersInput { where?: { id_in?: string[]; teams_in?: string[] }; sort?: string[] }` (`@webiny/api-core/features/users/shared/types.js`), `AdminUser { id; displayName; email; teams?; ... }` (`@webiny/api-core/types/users.js`); `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`), `withoutAuthorization<T>(cb: () => Promise<T>): Promise<T>`.
  - Phase 2/3: `CurrentReviewViewer.getActor(): Result<Actor, WorkflowsNotAuthenticatedError>`, `WorkflowsPermissions.canEdit(): Promise<boolean>`, `WorkflowsNotAuthorizedError({ action })`, `WorkflowPersistenceError(error: PersistenceErrorSource)` (`Workflows/Workflow/Persistence`).
  - 4.1 Task 2 (test helper `~tests/__helpers/FakeListUsers.js`): `class FakeListUsers implements ListUsersUseCase.Interface` with `constructor(users: FakeUser[])`, `FakeUser { id: string; displayName: string; teams: string[] }` (email `<id>@webiny.test`), `calls: ListUsersCall[]` (`{ input: ListUsersInput; authorizationEnabled: boolean | null }`), `failuresLeft` (fails with `UserStorageError`, message `"Storage is not available."`), `watch(identityContext)`; registered with `container.registerInstance(ListUsersUseCase, fake)`.
- Produces:
  - Constants (`~/constants.js`): `DEFAULT_USER_LIST_LIMIT = 50`, `MAX_USER_LIST_LIMIT = 200`.
  - Types (`~/domain/config/types.js`): `WorkflowUser { id: string; displayName: string }`, `WorkflowUserList { users: WorkflowUser[]; missingIds: string[] }`.
  - `ListWorkflowUsersUseCase` (`~/features/config/ListWorkflowUsers/index.js`), `execute(input?: ListWorkflowUsersInput): Promise<Result<WorkflowUserList, ListWorkflowUsersUseCase.Error>>`; `ListWorkflowUsersInput { search?: string | null; ids?: string[] | null; limit?: number | null }`; errors `Workflows/NotAuthenticated`, `Workflows/NotAuthorized` (action `"list users"`), `Workflows/Workflow/Validation` (`WorkflowValidationError`, "Too many user ids.", R126), `Workflows/Workflow/Persistence`. Feature `ListWorkflowUsersFeature`.
  - GraphQL root: `WorkflowsQuery.listUsers(search: String, ids: [String!], limit: Int): WorkflowsUserListResponse!`; `WorkflowsUserListResult { users: [WorkflowsUser!]! missingIds: [String!]! }`; `WorkflowsUserListResponse { data: WorkflowsUserListResult error: WorkflowsError }`.
  - Shared GraphQL types (for 4.3 Task 10 and 4.4 Task 13):
    - `WorkflowsUser { id: ID! displayName: String! }`
    - `WorkflowsStepCandidate { id: ID! displayName: String! excluded: Boolean! excludedReason: String }` (R120; maps 1:1 from Task 5's `StepCandidate`)
    - `enum WorkflowsRoutingTraceOutcome { matched notMatched skipped }`
    - `WorkflowsRoutingTraceEntry { ruleId: String! outcome: WorkflowsRoutingTraceOutcome! reason: String }`
    - `WorkflowsRoutingSkip { userId: ID! displayName: String reason: String! }` (R129; maps 1:1 from Task 5's `RoutingSkippedUser`; `displayName` null for a non-member)
    - `WorkflowsRoutingInspection { owner: WorkflowsUser source: String! ruleId: String strategy: String trace: [WorkflowsRoutingTraceEntry!]! skipped: [WorkflowsRoutingSkip!]! }` (R121, R129; maps 1:1 from Task 5's `RoutingInspection`)

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import {
    AnonymousIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, OTHER_TEAM_ID, REVIEW_TEAM_ID } from "~tests/__helpers/fixtures.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
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

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface UsersContextParams extends CmsTestHandlerParams {
    users?: FakeUser[];
    listUsers?: ListUsersUseCase.Interface;
}

const createUsersContext = async (params: UsersContextParams = {}) => {
    const users = new FakeListUsers(params.users ?? USERS);
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
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

describe("ListWorkflowUsersUseCase (D48, D117, R123)", () => {
    it("lists every user as id and display name, sorted by display name, without authorization", async () => {
        const { listUsers, users } = await createUsersContext({ permissions: EDITOR });

        const list = expectOk(await listUsers.execute());

        expect(list).toEqual({
            users: [
                { id: "user-anna", displayName: "Anna Adams" },
                { id: "user-bob", displayName: "bob Brown" },
                { id: "user-cara", displayName: "Cara Clark" }
            ],
            missingIds: []
        });
        expect(users.calls).toEqual([{ input: {}, authorizationEnabled: false }]);
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
        expect(byDefault.users[0]).toEqual({ id: "user-000", displayName: "User 000" });
        expect(tooMany.users).toHaveLength(200);
        expect(tooFew.users).toEqual([{ id: "user-000", displayName: "User 000" }]);
        expect(fraction.users).toHaveLength(2);
        expect(notFinite.users).toHaveLength(50);
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
                { id: "user-cara", displayName: "Cara Clark" },
                { id: "user-anna", displayName: "Anna Adams" }
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

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list users" });
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

In `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`:

Add after the `createContextHandler` import:

```ts
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
```

Add after the `PAST` constant:

```ts
/** The fake gives every user the email `<id>@webiny.test`. */
const API_USERS: FakeUser[] = [
    { id: "user-cara", displayName: "Cara Clark", teams: [] },
    { id: "user-anna", displayName: "Anna Adams", teams: [] }
];
```

Add after the `LIST_STEP_TYPES` constant:

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
                    missingIds
                }
                ${ERROR_FIELDS}
            }
        }
    }
`;
```

Add after the `StepTypesEnvelope` interface:

```ts
interface UserRow {
    id: string;
    displayName: string;
}

interface UserListRow {
    users: UserRow[];
    missingIds: string[];
}

interface UserListEnvelope {
    data: UserListRow | null;
    error: ErrorRow | null;
}
```

Add after the `ListStepTypesResult` interface:

```ts
interface ListUsersResult {
    listUsers: UserListEnvelope;
}
```

Replace `createApi` with:

```ts
const createApi = async (params: CmsTestHandlerParams) => {
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
        getSettings: createQuery<GraphQLBody<WorkflowsRoot<GetSettingsResult>>>(GET_SETTINGS),
        updateSettings:
            createMutation<GraphQLBody<WorkflowsRoot<UpdateSettingsResult>>>(UPDATE_SETTINGS),
        listStepTypes: createQuery<GraphQLBody<WorkflowsRoot<ListStepTypesResult>>>(LIST_STEP_TYPES),
        listUsers: createQuery<GraphQLBody<WorkflowsRoot<ListUsersResult>>>(LIST_USERS)
    };
};
```

Add these tests after `it("refuses the step types to a user without editor", ...)`:

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

    it("refuses the user list to a user without editor", async () => {
        const api = await createApi({ permissions: REASSIGNER });

        const [response] = await api.listUsers({ limit: 10 });

        expect(response.data.workflows.listUsers).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to list users.",
                data: { action: "list users" }
            }
        });
        expect(api.users.calls).toEqual([]);
    });
```

In `it("exposes the shared types the app schemas reuse (R100)", ...)` replace

```ts
        expect(memberNames(types, "WorkflowsQuery")).toEqual(["getSettings", "listStepTypes"]);
```

with

```ts
        expect(memberNames(types, "WorkflowsQuery")).toEqual([
            "getSettings",
            "listStepTypes",
            "listUsers"
        ]);
        expect(memberNames(types, "WorkflowsUser")).toEqual(["id", "displayName"]);
        expect(memberNames(types, "WorkflowsUserListResult")).toEqual(["users", "missingIds"]);
        expect(memberNames(types, "WorkflowsUserListResponse")).toEqual(["data", "error"]);
        expect(memberNames(types, "WorkflowsStepCandidate")).toEqual([
            "id",
            "displayName",
            "excluded",
            "excludedReason"
        ]);
        expect(memberNames(types, "WorkflowsRoutingTraceOutcome")).toEqual([
            "matched",
            "notMatched",
            "skipped"
        ]);
        expect(memberNames(types, "WorkflowsRoutingTraceEntry")).toEqual([
            "ruleId",
            "outcome",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsRoutingSkip")).toEqual([
            "userId",
            "displayName",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsRoutingInspection")).toEqual([
            "owner",
            "source",
            "ruleId",
            "strategy",
            "trace",
            "skipped"
        ]);
```

In `packages/api-workflows/__tests__/registration.test.ts`, add after the `ListWorkflowStepTypesUseCase` import:

```ts
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
```

and after `expect(container.resolveAll(ListWorkflowStepTypesUseCase)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(ListWorkflowUsersUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. `ListWorkflowUsers.test.ts` and `registration.test.ts` cannot resolve `~/features/config/ListWorkflowUsers/index.js`; in `workflowsSchema.test.ts` the two `listUsers` tests fail with a GraphQL validation error (`Cannot query field "listUsers" on type "WorkflowsQuery"`) and the introspection test fails on the `WorkflowsQuery` field list; the other tests pass.

- [ ] **Step 3: Constants and types**

In `packages/api-workflows/src/constants.ts`, append:

```ts

/** The shared user list (R123): rows per call by default and at most. */
export const DEFAULT_USER_LIST_LIMIT = 50;
export const MAX_USER_LIST_LIMIT = 200;
```

In `packages/api-workflows/src/domain/config/types.ts`, append:

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

- [ ] **Step 4: The use case**

Create `packages/api-workflows/src/features/config/ListWorkflowUsers/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowUserList } from "~/domain/config/types.js";
import type {
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface ListWorkflowUsersInput {
    /** Case-insensitive substring of the display name or the email; blank lists everyone. */
    search?: string | null;
    /** Look these users up instead (D117), at most 200 distinct; `search` and `limit` are ignored. */
    ids?: string[] | null;
    /** Rows of a search: 50 by default, 1..200 (R92). */
    limit?: number | null;
}

export interface IListWorkflowUsersUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    validation: WorkflowValidationError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowUsersUseCaseErrors[keyof IListWorkflowUsersUseCaseErrors];

export interface IListWorkflowUsersUseCase {
    execute(input?: ListWorkflowUsersInput): Promise<Result<WorkflowUserList, UseCaseError>>;
}

/**
 * The tenant's users for the workflow editor, the settings page and the request dialog (spec 10,
 * D48, D117, R123): needs `workflows.editor`. Reads users as the system (they need
 * `adminUsers.user`) and returns only id and display name. The shared `listUsers` GraphQL
 * operation calls this, never api-core directly.
 */
export const ListWorkflowUsersUseCase = createAbstraction<IListWorkflowUsersUseCase>(
    "ListWorkflowUsersUseCase"
);

export namespace ListWorkflowUsersUseCase {
    export type Interface = IListWorkflowUsersUseCase;
    export type Input = ListWorkflowUsersInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowUserList, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/config/ListWorkflowUsers/ListWorkflowUsersUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { DEFAULT_USER_LIST_LIMIT, MAX_USER_LIST_LIMIT } from "~/constants.js";
import type { WorkflowUser } from "~/domain/config/types.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError, WorkflowValidationError } from "~/domain/workflow/errors.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowUsersUseCase as UseCase } from "./abstractions.js";

const toWorkflowUser = (user: AdminUser): WorkflowUser => {
    return { id: user.id, displayName: user.displayName };
};

class ListWorkflowUsersUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
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

        // A membership lookup, not an access decision: `ListUsers` needs `adminUsers.user` (D48).
        let listed: Result<AdminUser[], ListUsersUseCase.Error>;
        try {
            listed = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute(ids ? { where: { id_in: ids } } : {});
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
            const users: WorkflowUser[] = [];
            const missingIds: string[] = [];
            for (const id of ids) {
                const user = byId.get(id);
                if (user) {
                    users.push(toWorkflowUser(user));
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
            .map(toWorkflowUser);
        return Result.ok({ users, missingIds: [] });
    }
}

export const ListWorkflowUsersUseCase = UseCase.createImplementation({
    implementation: ListWorkflowUsersUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, IdentityContext, ListUsersUseCase]
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowUsers/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowUsersUseCase } from "./ListWorkflowUsersUseCase.js";

export const ListWorkflowUsersFeature = createFeature({
    name: "Workflows/ListWorkflowUsers",
    register(container) {
        container.register(ListWorkflowUsersUseCase);
    }
});
```

Create `packages/api-workflows/src/features/config/ListWorkflowUsers/index.ts`:

```ts
export { ListWorkflowUsersUseCase } from "./abstractions.js";
export type { ListWorkflowUsersInput } from "./abstractions.js";
export type { WorkflowUser, WorkflowUserList } from "~/domain/config/types.js";
```

- [ ] **Step 5: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `ListWorkflowStepTypesFeature` import:

```ts
import { ListWorkflowUsersFeature } from "~/features/config/ListWorkflowUsers/feature.js";
```

and after `ListWorkflowStepTypesFeature.register(container);`:

```ts
        ListWorkflowUsersFeature.register(container);
```

- [ ] **Step 6: GraphQL**

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`:

Add after the `ListWorkflowStepTypesUseCase` import:

```ts
import { ListWorkflowUsersUseCase } from "~/features/config/ListWorkflowUsers/index.js";
```

Add after the `UpdateSettingsArgs` interface:

```ts
interface ListUsersArgs {
    search?: string | null;
    ids?: string[] | null;
    limit?: number | null;
}
```

In `SHARED_TYPE_DEFS`, add after the `WorkflowsActor` type:

```graphql
    "A user as the workflows screens see one (D104): no email, roles or teams."
    type WorkflowsUser {
        id: ID!
        displayName: String!
    }

    "A member of a step's teams (R120). excludedReason is null unless the viewer has editor or reassign (D97)."
    type WorkflowsStepCandidate {
        id: ID!
        displayName: String!
        excluded: Boolean!
        excludedReason: String
    }

    enum WorkflowsRoutingTraceOutcome {
        matched
        notMatched
        skipped
    }

    type WorkflowsRoutingTraceEntry {
        ruleId: String!
        outcome: WorkflowsRoutingTraceOutcome!
        reason: String
    }

    "A person routing skipped (R129, D118). displayName is null for a user outside the step's teams."
    type WorkflowsRoutingSkip {
        userId: ID!
        displayName: String
        reason: String!
    }

    "What routing would do with an unsaved step config (R121, D45, D118). No load numbers (D104)."
    type WorkflowsRoutingInspection {
        owner: WorkflowsUser
        source: String!
        ruleId: String
        strategy: String
        trace: [WorkflowsRoutingTraceEntry!]!
        skipped: [WorkflowsRoutingSkip!]!
    }
```

In `ROOT_TYPE_DEFS`, add after the `WorkflowsStepTypeListResponse` type:

```graphql
    type WorkflowsUserListResult {
        users: [WorkflowsUser!]!
        "Requested ids with no user (D117); empty for a search."
        missingIds: [String!]!
    }

    type WorkflowsUserListResponse {
        data: WorkflowsUserListResult
        error: WorkflowsError
    }
```

and replace the `WorkflowsQuery` type with:

```graphql
    type WorkflowsQuery {
        getSettings(includeExpired: Boolean): WorkflowsSettingsResponse!
        listStepTypes: WorkflowsStepTypeListResponse!
        "Search by display name or email (limit 50 by default, at most 200), or look up ids (D117)."
        listUsers(search: String, ids: [String!], limit: Int): WorkflowsUserListResponse!
    }
```

Add the resolver after the `WorkflowsQuery.listStepTypes` resolver:

```ts
        builder.addResolver<ListUsersArgs>({
            path: "WorkflowsQuery.listUsers",
            dependencies: [ListWorkflowUsersUseCase],
            resolver: (listUsers: ListWorkflowUsersUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await listUsers.execute({
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
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test:os packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the shared workflows user list and the candidate and inspector graphql types

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
