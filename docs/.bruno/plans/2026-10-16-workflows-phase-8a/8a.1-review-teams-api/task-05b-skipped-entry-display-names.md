### Task 5b: Skipped-entry display names (`WorkflowsAssignmentEntry.userDisplayName`)

Spec 13.1 (assignment entries in the drawer); user answer Q21 (`../00-answers.md`); R251, A90, D89, D127, R87 and D132 (a dependency failure never rejects a resolver), SEC-66 pattern (only the lookup runs without authorization), Review Focus 20. The skipped-by-assignment entries of a review step carry only `userId`, so the Review details drawer (Task 18) could not name the person ("{Name}: {reason}"). This task adds the display name server-side, once, in the shared schema, so the CMS and WB responses carry it without a wrapper change. It is the mirror of Task 1: same field-resolver mechanism, a user lookup instead of a team lookup, nothing stored.

- `ResolveReviewUserNameUseCase` (api-workflows, internal, no permission check of its own): reads one user with `GetUserUseCase` and returns the display name as a string, nothing else of the user. `GetUserUseCase` needs the `adminUsers.user` permission, which a reviewer or editor does not have, so **only** `getUser.execute({ id })` runs inside `identityContext.withoutAuthorization(...)`; nothing else is wrapped. A user that does not exist (`UserNotFoundError`) is `Result.ok(null)`. A throw, or any other failed Result, is a failed `ReviewPersistenceError`, logged once with `Could not look up the display name of a skipped user.`
- Shared schema: `WorkflowsAssignmentEntry.userDisplayName: String` next to `userId`, resolved by a field resolver at `path: "WorkflowsAssignmentEntry.userDisplayName"` (the mechanism of Task 1). The resolver never fails a read: an entry without `userId` resolves `null` with no lookup; a failed Result resolves `null` (the use case logged); an unexpected throw is logged once with `Could not resolve the display name of a skipped user.` and resolves `null`.
- A90 (accepted, no cache): `assignments` are selected only on a single review read, so review lists do zero lookups. On a single read the resolver runs once per skip entry, only for viewers allowed to see them (editor or reassign, D89), a handful per step. `GetUserUseCase` has no caching decorator and duplicates are not memoised (a user skipped twice is read twice); an in-resolver per-request `Map<userId, Promise<string | null>>` was considered and not added (code-style "check the layer below") (code-style "check the layer below"). The drawer shows `SKIPPED_PERSON_LABEL` while the name is `null` (Task 18).
- The feature is registered in `WorkflowsFeature` next to `ListReviewCandidateTeamsFeature` (Task 1). Nothing is stored; no storage key, model or schema of the database changes.

**Files:**
- Create: `packages/api-workflows/src/features/review/ResolveReviewUserName/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ResolveReviewUserName/ResolveReviewUserNameUseCase.ts`
- Create: `packages/api-workflows/src/features/review/ResolveReviewUserName/feature.ts`
- Create: `packages/api-workflows/src/features/review/ResolveReviewUserName/index.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts` (the file as Task 1 left it)
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts` (the file as Task 1 left it)
- Create: `packages/api-workflows/__tests__/__helpers/FakeNamedUsers.ts`
- Create: `packages/api-workflows/__tests__/review/ResolveReviewUserName.test.ts`
- Create: `packages/api-workflows/__tests__/graphql/workflowsAssignmentUserName.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (it asserts the exact fields of `WorkflowsAssignmentEntry`)
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsAssignmentUserName.test.ts`
- Existing, must stay green: `packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts`, `packages/api-workflows/__tests__/identity/CandidateReadAccess.test.ts`, `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`, `packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`

**Interfaces:**
- Consumes (existing, verified with codegraph): `GetUserUseCase` (`@webiny/api-core/features/users/GetUser/index.js`; `execute({ id })` returns `Result<AdminUser, GetUserUseCase.Error>` and fails with `NotAuthorizedError` without `adminUsers.user`; the same import `CandidateReadAccess` uses inside `withoutAuthorization`), `UserNotFoundError` (`@webiny/api-core/features/users/shared/errors.js`, code `AdminUser/NotFound`; the repository returns it for an unknown id), `IdentityContext.withoutAuthorization` and `isAuthorizationEnabled` (`@webiny/api-core/features/security/IdentityContext/index.js`), `Logger` (`@webiny/api-core/features/logger/index.js`), `ReviewPersistenceError` (`~/domain/review/errors.js`), the `addResolver` field-resolver mechanism and the `ListReviewCandidateTeams` wiring of Task 1 (`WorkflowsSchemaFactory.ts` already imports `Logger`), test helpers `createContextHandler` (`__tests__/__helpers/handler.ts`), `captureLoggedErrors`/`loggedErrors` (`__helpers/CapturingLogger.ts`), `expectOk` (`__helpers/fixtures.ts`); CMS: `createUserContext`, `createGraphQLClient`, `storeWorkflow`, `createAuthorEntry`, `expectOk`, `requestEntryReview`, `seedAssignmentRecords` (the skip scenario of `targetReviewAndAssignments.test.ts`: one `outcome` entry with `userId: null` and one `skip` entry with `userId: REQUESTER.id`), `EDITOR`, `REQUESTER`, `CMS_READER`, `WORKFLOWS_EDITOR`, `captureLoggedErrors`/`loggedErrors`.
- Produces: `ResolveReviewUserNameInput { userId: string }`; `ResolveReviewUserNameUseCase` (`"ResolveReviewUserNameUseCase"`, `execute(input): Promise<Result<string | null, ReviewPersistenceError>>`, namespace `Interface`, `Input`, `Error`, `Return`); `ResolveReviewUserNameFeature` (`"Workflows/ResolveReviewUserName"`); GraphQL `WorkflowsAssignmentEntry.userDisplayName: String`. Consumed by Task 8 (`ReviewAssignmentEntryDto.userDisplayName`, `REVIEW_ASSIGNMENT_FIELDS`, `ReviewAssignmentEntry.userDisplayName: string | null`) and Task 18 (the skipped box).

- [ ] **Step 1: Write the failing tests**

First the shared fake. Create `packages/api-workflows/__tests__/__helpers/FakeNamedUsers.ts`. It behaves like the real `GetUserUseCase` for the parts this task relies on: it refuses a caller without `adminUsers.user` (the permission lookup returns the wildcard while authorization is disabled, A68), it records the authorization state of every call, and it knows two users by name. The `mode` makes it throw or fail like a broken storage driver:

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { GetUserInput } from "@webiny/api-core/features/users/shared/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";

export const KNOWN_USER_ID = "user-maja";
export const KNOWN_USER_NAME = "Maja Kos";
export const OTHER_KNOWN_USER_ID = "user-rita";
export const OTHER_KNOWN_USER_NAME = "Rita Requester";

const USER_NAMES: Record<string, string> = {
    [KNOWN_USER_ID]: KNOWN_USER_NAME,
    [OTHER_KNOWN_USER_ID]: OTHER_KNOWN_USER_NAME
};

// A new fake rather than an extension of `FakeAdminUsers.ts`: that one has no names, no permission
// check and no authorization recording, and `CandidateReadAccess.test.ts` relies on its shape.
export type FakeNamedUsersMode = "stored" | "throwing" | "failing";

export interface UserLookupCall {
    userId: string;
    authorizationEnabled: boolean;
}

/** Every `GetUserUseCase.execute` call, with the authorization state it ran in. Clear it per test. */
export const userLookups: UserLookupCall[] = [];

class FakeNamedUsers implements GetUserUseCase.Interface {
    public constructor(
        private getIdentityContext: () => IdentityContext.Interface,
        private mode: FakeNamedUsersMode
    ) {}

    public async execute(input: GetUserInput): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        const identityContext = this.getIdentityContext();
        const id = input.id ?? "";
        userLookups.push({
            userId: id,
            authorizationEnabled: identityContext.isAuthorizationEnabled()
        });

        if (this.mode === "throwing") {
            throw new Error("Users are down.");
        }
        if (this.mode === "failing") {
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        // As the real use case: the caller needs the users permission.
        const permission = await identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }
        const displayName = USER_NAMES[id];
        if (!displayName) {
            return Result.fail(new UserNotFoundError(id));
        }
        return Result.ok({
            id,
            displayName,
            email: `${id}@webiny.test`,
            tenant: "root",
            createdOn: "2026-10-01T00:00:00.000Z",
            createdBy: null
        });
    }
}

/** Replaces `GetUserUseCase` of the request container. Call it in the test's `setup`. */
export const registerFakeNamedUsers = (
    container: Container,
    mode: FakeNamedUsersMode = "stored"
) => {
    container.registerInstance(
        GetUserUseCase,
        new FakeNamedUsers(() => container.resolve(IdentityContext), mode)
    );
};
```

Create `packages/api-workflows/__tests__/review/ResolveReviewUserName.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
import { KNOWN_USER_ID } from "~tests/__helpers/FakeNamedUsers.js";
import { KNOWN_USER_NAME } from "~tests/__helpers/FakeNamedUsers.js";
import { OTHER_KNOWN_USER_ID } from "~tests/__helpers/FakeNamedUsers.js";
import { OTHER_KNOWN_USER_NAME } from "~tests/__helpers/FakeNamedUsers.js";
import { registerFakeNamedUsers } from "~tests/__helpers/FakeNamedUsers.js";
import { userLookups } from "~tests/__helpers/FakeNamedUsers.js";
import type { FakeNamedUsersMode } from "~tests/__helpers/FakeNamedUsers.js";

/** Has a workflows permission, but no users permission, as a reviewer has. */
const REVIEWER_PERMISSIONS: SecurityPermission[] = [{ name: "workflows", reassign: true }];

interface SetupParams {
    permissions?: SecurityPermission[];
    mode?: FakeNamedUsersMode;
}

const setup = async (params: SetupParams = {}) => {
    const { context } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            registerFakeNamedUsers(container, params.mode);
        }
    });
    return {
        container: context.container,
        resolveName: context.container.resolve(ResolveReviewUserNameUseCase)
    };
};

describe("ResolveReviewUserNameUseCase (R251, A90)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        userLookups.length = 0;
    });

    it("returns the display name of a known user, and only the name", async () => {
        const { resolveName } = await setup();

        const name = expectOk(await resolveName.execute({ userId: KNOWN_USER_ID }));

        expect(name).toBe(KNOWN_USER_NAME);
        expect(userLookups.map(lookup => lookup.userId)).toEqual([KNOWN_USER_ID]);
        expect(loggedErrors).toEqual([]);
    });

    it("returns null for a user that does not exist, without a log", async () => {
        const { resolveName } = await setup();

        const name = expectOk(await resolveName.execute({ userId: "user-gone" }));

        expect(name).toBeNull();
        expect(loggedErrors).toEqual([]);
    });

    it("gives a viewer without the users permission the name, because the lookup runs without authorization", async () => {
        const { container, resolveName } = await setup({ permissions: REVIEWER_PERMISSIONS });
        const identityContext = container.resolve(IdentityContext);
        const direct = await container.resolve(GetUserUseCase).execute({ id: KNOWN_USER_ID });
        userLookups.length = 0;

        const name = expectOk(await resolveName.execute({ userId: OTHER_KNOWN_USER_ID }));

        expect(await identityContext.getPermission("adminUsers.user")).toBeNull();
        expect(direct.isFail()).toBe(true);
        expect(name).toBe(OTHER_KNOWN_USER_NAME);
    });

    it("wraps only the lookup in withoutAuthorization, once, and restores authorization", async () => {
        const { container, resolveName } = await setup({ permissions: REVIEWER_PERMISSIONS });
        const identityContext = container.resolve(IdentityContext);
        const withoutAuthorization = vi.spyOn(identityContext, "withoutAuthorization");

        expectOk(await resolveName.execute({ userId: KNOWN_USER_ID }));

        expect(withoutAuthorization).toHaveBeenCalledTimes(1);
        expect(userLookups).toEqual([{ userId: KNOWN_USER_ID, authorizationEnabled: false }]);
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });

    it("fails with a persistence error, logged once, when the lookup throws", async () => {
        const { container, resolveName } = await setup({ mode: "throwing" });

        const result = await resolveName.execute({ userId: KNOWN_USER_ID });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the display name of a skipped user.");
        expect(container.resolve(IdentityContext).isAuthorizationEnabled()).toBe(true);
    });

    it("fails with a persistence error, logged once, when the lookup fails other than not found", async () => {
        const { resolveName } = await setup({ mode: "failing" });

        const result = await resolveName.execute({ userId: KNOWN_USER_ID });

        expect(result.isFail()).toBe(true);
        expect(result.isFail() && result.error).toBeInstanceOf(ReviewPersistenceError);
        expect(result.isFail() && result.error.message).toBe("Storage is not available.");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the display name of a skipped user.");
    });
});
```

Create `packages/api-workflows/__tests__/graphql/workflowsAssignmentUserName.test.ts`. The shared `WorkflowsAssignmentEntry` is only reachable through the CMS and WB roots, which this package does not have, so, as in Task 1, the test registers a probe field on `WorkflowsQuery` that returns an entry with only the `userId` it was given; the real shared field resolver then runs on the real schema:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { KNOWN_USER_ID } from "~tests/__helpers/FakeNamedUsers.js";
import { KNOWN_USER_NAME } from "~tests/__helpers/FakeNamedUsers.js";
import { registerFakeNamedUsers } from "~tests/__helpers/FakeNamedUsers.js";
import { userLookups } from "~tests/__helpers/FakeNamedUsers.js";
import type { FakeNamedUsersMode } from "~tests/__helpers/FakeNamedUsers.js";

/** Has a workflows permission, but no users permission, as a reviewer has. */
const REVIEWER: SecurityPermission[] = [{ name: "workflows", reassign: true }];

interface ProbeArgs {
    userId?: string | null;
}

/**
 * The shared `WorkflowsAssignmentEntry` is only reachable through the app roots, which this package
 * does not have. A probe field returns an entry with only the `userId` the test sends, so the
 * field resolver of `userDisplayName` is exercised on the real shared schema.
 */
class AssignmentEntryProbeImpl implements GraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaFactory.SchemaBuilder): GraphQLSchemaFactory.Return {
        builder.addTypeDefs(/* GraphQL */ `
            extend type WorkflowsQuery {
                probeAssignmentEntry(userId: String): WorkflowsAssignmentEntry
            }
        `);
        builder.addResolver<ProbeArgs>({
            path: "WorkflowsQuery.probeAssignmentEntry",
            dependencies: [],
            resolver: () => {
                return async ({ args }) => {
                    const entry = {
                        id: "entry-1",
                        kind: "skip",
                        assignedOn: "2026-10-13T10:00:00.000Z",
                        source: "picked"
                    };
                    if (!args.userId) {
                        return entry;
                    }
                    return { ...entry, userId: args.userId };
                };
            }
        });
        return builder;
    }
}

const AssignmentEntryProbe = GraphQLSchemaFactory.createImplementation({
    implementation: AssignmentEntryProbeImpl,
    dependencies: []
});

/** An unexpected throw out of the use case, as a bug would cause. */
class ThrowingResolveUserNameImpl implements ResolveReviewUserNameUseCase.Interface {
    public constructor(private decoratee: ResolveReviewUserNameUseCase.Interface) {}

    public async execute(): ResolveReviewUserNameUseCase.Return {
        throw new Error("The use case crashed.");
    }
}

const ThrowingResolveUserName = ResolveReviewUserNameUseCase.createDecorator({
    decorator: ThrowingResolveUserNameImpl,
    dependencies: []
});

const PROBE = /* GraphQL */ `
    query Probe($userId: String) {
        workflows {
            probeAssignmentEntry(userId: $userId) {
                id
                userId
                userDisplayName
            }
        }
    }
`;

interface EntryRow {
    id: string;
    userId: string | null;
    userDisplayName: string | null;
}

interface ProbeBody {
    data: { workflows: { probeAssignmentEntry: EntryRow } };
    errors?: { message: string }[];
}

interface SetupParams extends CmsTestHandlerParams {
    mode?: FakeNamedUsersMode;
    throwing?: boolean;
}

const createApi = async (params: SetupParams = {}) => {
    const { createQuery } = await createContextHandler({
        permissions: params.permissions,
        setup: container => {
            captureLoggedErrors(container);
            registerFakeNamedUsers(container, params.mode);
            container.register(AssignmentEntryProbe);
            if (params.throwing) {
                container.registerDecorator(ThrowingResolveUserName);
            }
        }
    });
    return { probe: createQuery<ProbeBody>(PROBE) };
};

describe("WorkflowsAssignmentEntry.userDisplayName (R251, A90)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
        userLookups.length = 0;
    });

    it("returns the display name next to the user id", async () => {
        const { probe } = await createApi();

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry).toEqual({
            id: "entry-1",
            userId: KNOWN_USER_ID,
            userDisplayName: KNOWN_USER_NAME
        });
    });

    it("gives a viewer without the users permission the name", async () => {
        const { probe } = await createApi({ permissions: REVIEWER });

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry.userDisplayName).toBe(KNOWN_USER_NAME);
    });

    it("resolves null for a user that no longer exists and keeps the id", async () => {
        const { probe } = await createApi();

        const [body] = await probe({ userId: "user-gone" });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry).toEqual({
            id: "entry-1",
            userId: "user-gone",
            userDisplayName: null
        });
        expect(loggedErrors).toEqual([]);
    });

    it("resolves null with no lookup when the entry has no user id", async () => {
        const { probe } = await createApi();

        const [body] = await probe();

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry).toEqual({
            id: "entry-1",
            userId: null,
            userDisplayName: null
        });
        expect(userLookups).toEqual([]);
        expect(loggedErrors).toEqual([]);
    });

    it("resolves null and succeeds when the user lookup fails, with one log", async () => {
        const { probe } = await createApi({ mode: "failing" });

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry.id).toBe("entry-1");
        expect(body.data.workflows.probeAssignmentEntry.userDisplayName).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the display name of a skipped user.");
    });

    it("resolves null and succeeds when the use case throws, with one log", async () => {
        const { probe } = await createApi({ throwing: true });

        const [body] = await probe({ userId: KNOWN_USER_ID });

        expect(body.errors).toBeUndefined();
        expect(body.data.workflows.probeAssignmentEntry.userId).toBe(KNOWN_USER_ID);
        expect(body.data.workflows.probeAssignmentEntry.userDisplayName).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe(
            "Could not resolve the display name of a skipped user."
        );
    });
});
```

Update the two existing assertions. `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (the exact fields of `WorkflowsAssignmentEntry`; the new field sits right after `userId` in the schema):

```diff
         expect(memberNames(types, "WorkflowsAssignmentEntry")).toEqual([
             "id",
             "kind",
             "userId",
+            "userDisplayName",
             "assignedOn",
             "source",
             "ruleId",
             "by",
             "reason"
         ]);
```

`packages/api-workflows/__tests__/registration.test.ts` (Task 1 added the `ListReviewCandidateTeamsUseCase` import and assertion; add these next to them):

```diff
 import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
+import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
 import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
```

```diff
         expect(container.resolveAll(ListReviewCandidateTeamsUseCase)).toHaveLength(1);
+        expect(container.resolveAll(ResolveReviewUserNameUseCase)).toHaveLength(1);
         expect(container.resolveAll(ListReviewsUseCase)).toHaveLength(1);
```

Create the CMS end-to-end case, `packages/api-headless-cms-workflows/__tests__/graphql/cmsAssignmentUserName.test.ts`. It uses the existing skip scenario (`seedAssignmentRecords`: an `outcome` entry without user and a `skip` entry for `REQUESTER`), reads one review as an editor (editor or reassign see skip entries, D89) and replaces `GetUserUseCase` with a fake that knows `REQUESTER` by name:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { GetUserInput } from "@webiny/api-core/features/users/shared/types.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";
import { UserStorageError } from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";
import { EDITOR } from "~tests/__helpers/identities.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { WORKFLOWS_EDITOR } from "~tests/__helpers/permissions.js";
import { SKIP_RECORD_REASON } from "~tests/__helpers/seeds.js";
import { seedAssignmentRecords } from "~tests/__helpers/seeds.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** Knows `REQUESTER` by name; every other id is "not found". Fails every lookup when `failing`. */
class SkippedUsers implements GetUserUseCase.Interface {
    public constructor(private failing: boolean) {}

    public async execute(input: GetUserInput): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        if (this.failing) {
            return Result.fail(new UserStorageError(new Error("Storage is not available.")));
        }
        if (input.id !== REQUESTER.id) {
            return Result.fail(new UserNotFoundError(input.id ?? "unknown"));
        }
        return Result.ok({
            id: REQUESTER.id,
            displayName: REQUESTER.displayName,
            email: "requester@webiny.test",
            tenant: "root",
            createdOn: "2026-10-01T00:00:00.000Z",
            createdBy: null
        });
    }
}

const registerUsers = (container: Container) => {
    container.registerInstance(GetUserUseCase, new SkippedUsers(false));
};

const registerFailingUsers = (container: Container) => {
    container.registerInstance(GetUserUseCase, new SkippedUsers(true));
    captureLoggedErrors(container);
};

const ERROR = "error { code message data }";

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data {
                    review {
                        id
                        steps {
                            id
                            assignments { kind userId userDisplayName reason }
                        }
                    }
                }
                ${ERROR}
            }
        }
    }
`;

interface AssignmentRow {
    kind: string;
    userId: string | null;
    userDisplayName: string | null;
    reason: string | null;
}

const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];

/** Admin stores the workflow; "Ann" has a review whose only step has a skip and an outcome entry. */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    await seedAssignmentRecords(admin, review);
    return { review };
};

describe("CMS skipped-entry display names (R251, Q21)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("carries the display name on the skip entry of a single review read, and null on the outcome entry", async () => {
        const { review } = await createScenario();
        const editor = createGraphQLClient({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [registerUsers]
        });

        const body = await editor(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.getCmsEntryReview;
        expect(result.error).toBeNull();
        const [step] = result.data.review.steps;
        expect(step.id).toBe(STEP_ID);
        const skip = step.assignments.find((entry: AssignmentRow) => entry.kind === "skip");
        const outcome = step.assignments.find((entry: AssignmentRow) => entry.kind === "outcome");
        expect(skip).toEqual({
            kind: "skip",
            userId: REQUESTER.id,
            userDisplayName: REQUESTER.displayName,
            reason: SKIP_RECORD_REASON
        });
        expect(outcome).toMatchObject({ kind: "outcome", userId: null, userDisplayName: null });
    });

    it("still returns the review, with a null name and one log, when the user lookup fails", async () => {
        const { review } = await createScenario();
        const editor = createGraphQLClient({
            identity: EDITOR,
            permissions: EDITOR_PERMISSIONS,
            legacyPlugins: [registerFailingUsers]
        });

        const body = await editor(GET_REVIEW, { id: review.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.getCmsEntryReview;
        expect(result.error).toBeNull();
        expect(result.data.review.id).toBe(review.id);
        const skip = result.data.review.steps[0].assignments.find(
            (entry: AssignmentRow) => entry.kind === "skip"
        );
        expect(skip).toMatchObject({ userId: REQUESTER.id, userDisplayName: null });
        const lookupLogs = loggedErrors.filter(error => {
            return error.message === "Could not look up the display name of a skipped user.";
        });
        expect(lookupLogs).toHaveLength(1);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-workflows/__tests__/review/ResolveReviewUserName.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsAssignmentUserName.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsAssignmentUserName.test.ts 2>&1 | tail -50
```

Expected: FAIL. The unit test and the registration test cannot resolve `~/features/review/ResolveReviewUserName/index.js`; the GraphQL test and the CMS test fail with `Cannot query field "userDisplayName" on type "WorkflowsAssignmentEntry"` (schema validation; the CMS package reads api-workflows through its build output, which is still the old one); the schema test misses `userDisplayName`.

- [ ] **Step 3: Implement**

`packages/api-workflows/src/features/review/ResolveReviewUserName/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface ResolveReviewUserNameInput {
    /** The `userId` of one assignment entry. */
    userId: string;
}

export interface IResolveReviewUserNameUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError =
    IResolveReviewUserNameUseCaseErrors[keyof IResolveReviewUserNameUseCaseErrors];

export interface IResolveReviewUserNameUseCase {
    execute(input: ResolveReviewUserNameInput): Promise<Result<string | null, UseCaseError>>;
}

/**
 * The display name of a user a review screen shows by name, such as a person skipped by
 * assignment (R251). Internal (D132): no permission check of its own, the field resolver of
 * `WorkflowsAssignmentEntry.userDisplayName` runs after the wrappers authorized the read. Only the
 * user lookup runs without authorization, because `GetUserUseCase` needs a users permission; the
 * result is the display name and nothing else. A user that does not exist is `null`.
 */
export const ResolveReviewUserNameUseCase = createAbstraction<IResolveReviewUserNameUseCase>(
    "ResolveReviewUserNameUseCase"
);

export namespace ResolveReviewUserNameUseCase {
    export type Interface = IResolveReviewUserNameUseCase;
    export type Input = ResolveReviewUserNameInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<string | null, UseCaseError>>;
}
```

`packages/api-workflows/src/features/review/ResolveReviewUserName/ResolveReviewUserNameUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { ResolveReviewUserNameUseCase as UseCase } from "./abstractions.js";

class ResolveReviewUserNameUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUser: GetUserUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // `GetUserUseCase` needs a users permission, which a reviewer does not have. A name lookup
        // is not an access decision, so only this lookup runs without authorization (R251).
        let result: Awaited<ReturnType<GetUserUseCase.Interface["execute"]>>;
        try {
            result = await this.identityContext.withoutAuthorization(() => {
                return this.getUser.execute({ id: input.userId });
            });
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            this.logger.error(
                { error: cause, userId: input.userId },
                "Could not look up the display name of a skipped user."
            );
            return Result.fail(new ReviewPersistenceError(cause));
        }

        if (result.isOk()) {
            return Result.ok(result.value.displayName);
        }
        // A deleted user has no name; the entry still keeps its `userId`.
        if (result.error instanceof UserNotFoundError) {
            return Result.ok(null);
        }
        this.logger.error(
            { error: result.error, userId: input.userId },
            "Could not look up the display name of a skipped user."
        );
        return Result.fail(new ReviewPersistenceError(result.error));
    }
}

export const ResolveReviewUserNameUseCase = UseCase.createImplementation({
    implementation: ResolveReviewUserNameUseCaseImpl,
    dependencies: [IdentityContext, GetUserUseCase, Logger]
});
```

`packages/api-workflows/src/features/review/ResolveReviewUserName/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ResolveReviewUserNameUseCase } from "./ResolveReviewUserNameUseCase.js";

export const ResolveReviewUserNameFeature = createFeature({
    name: "Workflows/ResolveReviewUserName",
    register(container) {
        container.register(ResolveReviewUserNameUseCase);
    }
});
```

`packages/api-workflows/src/features/review/ResolveReviewUserName/index.ts`:

```ts
export { ResolveReviewUserNameUseCase } from "./abstractions.js";
export type { ResolveReviewUserNameInput } from "./abstractions.js";
```

`packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`. Re-read the file first: Task 1 already added the `ListReviewCandidateTeamsUseCase` and `Logger` imports, the `CandidateTeamsParent` and `CandidateTeamsResolverArgs` interfaces, the `WorkflowsTeam` type and the `WorkflowsReviewStep.candidateTeams` resolver. Apply these four hunks (the rest of the file is unchanged).

1. The import, right after Task 1's `ListReviewCandidateTeamsUseCase` import:

```ts
import { ListReviewCandidateTeamsUseCase } from "~/features/review/ListReviewCandidateTeams/index.js";
import { ResolveReviewUserNameUseCase } from "~/features/review/ResolveReviewUserName/index.js";
```

2. The two interfaces, right after Task 1's `CandidateTeamsResolverArgs`:

```ts
interface CandidateTeamsResolverArgs {
    parent: CandidateTeamsParent;
}

interface AssignmentUserNameParent {
    userId?: string | null;
}

interface AssignmentUserNameResolverArgs {
    parent: AssignmentUserNameParent;
}
```

3. The type definition in `SHARED_TYPE_DEFS` (a new nullable field right after `userId`):

```diff
     type WorkflowsAssignmentEntry {
         id: ID!
         kind: WorkflowsAssignmentKind!
         userId: String
+        "The display name of the user (R251). Null when the entry has no user, the user no longer exists or the name could not be read."
+        userDisplayName: String
         assignedOn: DateTime!
         source: String!
```

4. The resolver in `execute`, right after Task 1's `WorkflowsReviewStep.candidateTeams` resolver and before `Query.workflows`:

```ts
        // Never fails the read: a review is readable without the names of skipped users (R87, R251).
        builder.addResolver({
            path: "WorkflowsAssignmentEntry.userDisplayName",
            dependencies: [ResolveReviewUserNameUseCase, Logger],
            resolver: (
                resolveName: ResolveReviewUserNameUseCase.Interface,
                logger: Logger.Interface
            ) => {
                return async ({ parent }: AssignmentUserNameResolverArgs) => {
                    if (!parent.userId) {
                        return null;
                    }
                    try {
                        const result = await resolveName.execute({ userId: parent.userId });
                        if (result.isFail()) {
                            // The use case logged the failure.
                            return null;
                        }
                        return result.value;
                    } catch (error) {
                        logger.error(
                            { error },
                            "Could not resolve the display name of a skipped user."
                        );
                        return null;
                    }
                };
            }
        });
```

`packages/api-workflows/src/WorkflowsFeature.ts` (re-read first; Task 1 added the `ListReviewCandidateTeamsFeature` import and registration):

```diff
 import { ListReviewCandidateTeamsFeature } from "~/features/review/ListReviewCandidateTeams/feature.js";
+import { ResolveReviewUserNameFeature } from "~/features/review/ResolveReviewUserName/feature.js";
 import { ListReviewsFeature } from "~/features/review/ListReviews/feature.js";
```

```diff
         // Team names of a review step's candidate teams (R208)
         ListReviewCandidateTeamsFeature.register(container);
+        // Display names of the users skipped by assignment (R251)
+        ResolveReviewUserNameFeature.register(container);
         // Review lists for the app wrappers (spec 11)
```

- [ ] **Step 4: Run the new tests on both storages, expect pass**

The CMS test reads api-workflows through its build output, so build it first (`verify:` if a run of the CMS test before the build already sees the new field, the build is harmless). Run one command at a time (parallel `test:os` runs clash on port 8001):

```bash
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
yarn test packages/api-workflows/__tests__/review/ResolveReviewUserName.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ResolveReviewUserName.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsAssignmentUserName.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsAssignmentUserName.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsAssignmentUserName.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsAssignmentUserName.test.ts 2>&1 | tail -50
```

Expected: PASS (6, 6 and 2 tests).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchemaLicense.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/identity/CandidateReadAccess.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows,api-headless-cms-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-workflows): name the users skipped by assignment in a review" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

## Contract notes

- The contract names `ResolveReviewUserNameUseCase` with dependencies `[IdentityContext, GetUserUseCase, Logger]`, `execute(input): Promise<Result<string | null, ReviewPersistenceError>>` and the two fixed log texts; all are kept as written. The contract's file list did not name the shared test fake; the task adds `__tests__/__helpers/FakeNamedUsers.ts` (one fake used by the two api-workflows tests, mirroring how Task 1 keeps its fakes in the test files, here shared because two files need it).
- The contract says the CMS case locates "the existing skip scenario of the assignment tests". It is `seedAssignmentRecords` (`__tests__/__helpers/seeds.ts`) as used by `wrappers/targetReviewAndAssignments.test.ts`; the CMS test reuses it and adds a second case for a failing lookup (the contract asked for one case).
- A real `GetUserUseCase` is not used in these tests: the test containers register no admin-user storage (`CandidateReadAccess.test.ts` replaces it the same way), so the fake reproduces the two behaviours the task depends on (a caller without `adminUsers.user` is refused, `UserNotFoundError` for an unknown id). The refusal check in `ResolveReviewUserName.test.ts` ("gives a viewer without the users permission the name") calls the fake directly without authorization to show it would refuse, then proves the use case gets the name. `verify:` the real `GetUserUseCase` code path (`packages/api-core/src/features/users/GetUser/GetUserUseCase.ts`) still reads `adminUsers.user` before the repository when implementing.
- Task 1 must be applied first: this task edits `WorkflowsSchemaFactory.ts`, `WorkflowsFeature.ts` and `registration.test.ts` after Task 1's hunks and relies on its `Logger` import and the shared field-resolver wiring.
- Nothing is stored and no model, key or schema of the database changes.
