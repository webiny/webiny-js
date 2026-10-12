### Task 6: `ReviewTargetReadAccess` port, `CandidateReadAccess`, adapter errors

D61, D133 point 4a, D134, R48, R50, R53-R55, R62, R67-R69, R71, R73. Three engine pieces the adapters need:

- `ReviewTargetReadAccess`: the engine's port for "can this user read the target" (one implementation per namespace, beside `ReviewTargetLoader` and `ReviewTargetSync`). Phase 4 consumes it for candidates and reassign; phase 2 registers and tests the implementations. Named so it does not clash with 1b's `ReviewTargetAccess` flags type in `domain/review/types.ts`, which stays (R71).
- `CandidateReadAccess`: evaluates one boolean read check as another admin user of the current tenant (R67, R68). It is not a general "run as" primitive: it returns a boolean, runs the check with authorization enabled (also inside `withoutAuthorization`), and answers `false` when the user is not an admin user of the current tenant or anything throws (fail closed). Correct only with Task 1.
- Shared errors for both adapters (`Workflows/Review/TargetLocked`, `Workflows/Review/PublishBlocked`, `Workflows/Review/ActiveReviewOnTrash`) and the `ReviewWithViewerFlags` read shape the get-review wrappers return.

**Files:**
- Create: `packages/api-workflows/src/features/review/ReviewTargetReadAccess/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetReadAccess/index.ts`
- Create: `packages/api-workflows/src/features/identity/CandidateReadAccess/abstractions.ts`
- Create: `packages/api-workflows/src/features/identity/CandidateReadAccess/CandidateReadAccess.ts`
- Create: `packages/api-workflows/src/features/identity/CandidateReadAccess/feature.ts`
- Create: `packages/api-workflows/src/features/identity/CandidateReadAccess/index.ts`
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeAdminUsers.ts`
- Create: `packages/api-workflows/__tests__/identity/CandidateReadAccess.test.ts`
- Create: `packages/api-workflows/__tests__/review/adapterErrors.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `IdentityContext.withIdentity`, `IdentityContext.withAuthorization`, `IdentityContext.withoutAuthorization` (Task 1), `AuthenticatedIdentity`, `TenantContext`, `GetUserUseCase` (`@webiny/api-core/features/users/GetUser/index.js`), `ReviewState`, `ReviewData`, `ReviewViewerFlags`, `WorkflowBlockingReview` (Task 3).
- Produces:
  - `ReviewTargetReadAccess.Interface { canHandle(model: string): boolean; canUserRead(params: ReviewTargetUserReadParams): Promise<boolean> }`, `ReviewTargetUserReadParams { userId: string; model: string; targetId: string; targetRevisionId: string }`.
  - `CandidateReadAccess.Interface { canUserRead(userId: string, check: () => Promise<boolean>): Promise<boolean> }`, registered in singleton scope (one per request container), reusing one identity per tenant and user.
  - `ReviewTargetLockedError` (`Workflows/Review/TargetLocked`), data `ReviewTargetLockedErrorData { reviewId; model; targetRevisionId; reviewState: ReviewState; action: ReviewTargetLockedAction }`, `ReviewTargetLockedAction = "update" | "move"`.
  - `ReviewPublishBlockedError` (`Workflows/Review/PublishBlocked`), data `ReviewPublishBlockedErrorData { model; targetRevisionId; workflowId; reviewState: ReviewState | null }`.
  - `ReviewActiveOnTrashError` (`Workflows/Review/ActiveReviewOnTrash`), data `ReviewActiveOnTrashErrorData { model: string; action: ReviewActiveOnTrashAction; reviews: WorkflowBlockingReview[] }` (each review names its target; `deleteMultiple` can list several targets), `ReviewActiveOnTrashAction = "trash" | "delete"`.
  - `ReviewWithViewerFlags { review: ReviewData; flags: ReviewViewerFlags }` (`domain/review/types.ts`).
  - Test helper `FakeAdminUsers` (`__tests__/__helpers/FakeAdminUsers.ts`): a `GetUserUseCase` that knows a fixed list of user ids.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/FakeAdminUsers.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { GetUserInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";

/**
 * Admin users of the current tenant by id, for `CandidateReadAccess` (R68). The fake replaces only
 * the use case: the authorizers still find no stored user, so `TestAuthorizer` grants each user
 * what `permissionsByIdentity` lists. Register with
 * `container.registerInstance(GetUserUseCase, new FakeAdminUsers([...ids]))`.
 */
export class FakeAdminUsers implements GetUserUseCase.Interface {
    public constructor(private userIds: string[]) {}

    public async execute(input: GetUserInput): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        const id = input.id ?? "";
        if (!this.userIds.includes(id)) {
            return Result.fail(new UserNotFoundError(id));
        }
        return Result.ok({
            id,
            displayName: id,
            email: `${id}@webiny.test`,
            tenant: "root",
            createdOn: "2026-10-01T00:00:00.000Z",
            createdBy: null
        });
    }
}
```

Create `packages/api-workflows/__tests__/identity/CandidateReadAccess.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Identity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeAdminUsers } from "~tests/__helpers/FakeAdminUsers.js";
import { CandidateReadAccess } from "~/features/identity/CandidateReadAccess/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";

const createCandidateContext = async () => {
    const { context } = await createContextHandler({
        // The request identity is an editor, so "no permissions" below cannot be inherited (R70).
        permissions: [{ name: "workflows", editor: true }],
        permissionsByIdentity: {
            "user-reassigner": [{ name: "workflows", reassign: true }]
        },
        setup: container => {
            container.registerInstance(
                GetUserUseCase,
                new FakeAdminUsers(["user-reassigner", "user-plain"])
            );
        }
    });
    return {
        candidates: context.container.resolve(CandidateReadAccess),
        permissions: context.container.resolve(WorkflowsPermissions),
        identityContext: context.container.resolve(IdentityContext)
    };
};

describe("CandidateReadAccess", () => {
    it("answers the check as the given admin user", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();
        let inside: Identity | null = null;

        const canReassign = await candidates.canUserRead("user-reassigner", async () => {
            inside = identityContext.getIdentity();
            return permissions.canReassign();
        });

        expect(canReassign).toBe(true);
        expect(inside).toMatchObject({ id: "user-reassigner", type: "admin" });
    });

    it("restores the request identity and its permissions afterwards", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();

        await candidates.canUserRead("user-reassigner", () => permissions.canReassign());

        expect(identityContext.getIdentity().id).toBe(DEFAULT_USER_ID);
        expect(await permissions.canEdit()).toBe(true);
        expect(await permissions.canReassign()).toBe(false);
    });

    it("grants nothing to an admin user without permissions (R70)", async () => {
        const { candidates, permissions } = await createCandidateContext();

        const canEdit = await candidates.canUserRead("user-plain", () => permissions.canEdit());

        expect(canEdit).toBe(false);
    });

    it("denies a user who is not an admin user of the current tenant, without running the check (R68)", async () => {
        const { candidates } = await createCandidateContext();
        let ran = false;

        const result = await candidates.canUserRead("user-elsewhere", async () => {
            ran = true;
            return true;
        });

        expect(result).toBe(false);
        expect(ran).toBe(false);
    });

    it("checks the user's real permissions inside withoutAuthorization (R67)", async () => {
        const { candidates, permissions, identityContext } = await createCandidateContext();

        const result = await identityContext.withoutAuthorization(() => {
            return candidates.canUserRead("user-plain", () => permissions.canEdit());
        });

        expect(result).toBe(false);
    });

    it("fails closed when the check throws", async () => {
        const { candidates } = await createCandidateContext();

        const result = await candidates.canUserRead("user-reassigner", async () => {
            throw new Error("Storage is down.");
        });

        expect(result).toBe(false);
    });

    it("reuses one identity per user within the request (R69)", async () => {
        const { candidates, identityContext } = await createCandidateContext();
        const seen: Identity[] = [];

        for (let i = 0; i < 2; i++) {
            await candidates.canUserRead("user-reassigner", async () => {
                seen.push(identityContext.getIdentity());
                return true;
            });
        }

        expect(seen[0]).toBe(seen[1]);
    });
});
```

Create `packages/api-workflows/__tests__/review/adapterErrors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    ReviewActiveOnTrashError,
    ReviewPublishBlockedError,
    ReviewTargetLockedError
} from "~/domain/review/errors.js";

describe("Adapter errors", () => {
    it("explains an update blocked by an active review (D62, D80)", () => {
        const error = new ReviewTargetLockedError({
            reviewId: "review-1",
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            reviewState: "approved",
            action: "update"
        });

        expect(error.code).toBe("Workflows/Review/TargetLocked");
        expect(error.message).toBe(
            'This content cannot be changed while its review is active (review state "approved"). Create a new revision to make changes.'
        );
        expect(error.data).toEqual({
            reviewId: "review-1",
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            reviewState: "approved",
            action: "update"
        });
    });

    it("explains a move blocked by an in-progress review (D84)", () => {
        const error = new ReviewTargetLockedError({
            reviewId: "review-1",
            model: "wb.page",
            targetRevisionId: "page-1#0002",
            reviewState: "inProgress",
            action: "move"
        });

        expect(error.message).toBe(
            "This content cannot be moved to another folder while its review is in progress."
        );
    });

    it("explains a publish without an approved review (D79)", () => {
        const missing = new ReviewPublishBlockedError({
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            workflowId: "workflow-1",
            reviewState: null
        });
        const inProgress = new ReviewPublishBlockedError({
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            workflowId: "workflow-1",
            reviewState: "inProgress"
        });

        expect(missing.code).toBe("Workflows/Review/PublishBlocked");
        expect(missing.message).toBe(
            "This content can only be published after its review is approved. Request a review first."
        );
        expect(inProgress.message).toBe(
            'This content can only be published after its review is approved. The review is "inProgress".'
        );
        expect(inProgress.data).toEqual({
            model: "cms.article",
            targetRevisionId: "article-1#0001",
            workflowId: "workflow-1",
            reviewState: "inProgress"
        });
    });

    it("explains a trash or delete refused while a review is in progress (D134)", () => {
        const review = {
            reviewId: "review-1",
            model: "cms.article",
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            stepPosition: 1,
            stepCount: 2,
            stepName: "Legal review"
        };
        const trash = new ReviewActiveOnTrashError({
            model: "cms.article",
            action: "trash",
            reviews: [review]
        });
        const remove = new ReviewActiveOnTrashError({
            model: "cms.article",
            action: "delete",
            reviews: [review]
        });

        expect(trash.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(trash.message).toBe(
            "This content has a review in progress. Trashing it cancels the review."
        );
        expect(remove.message).toBe(
            "This content has a review in progress. Deleting it cancels the review."
        );
        expect(trash.data).toEqual({
            model: "cms.article",
            action: "trash",
            reviews: [review]
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/identity/CandidateReadAccess.test.ts packages/api-workflows/__tests__/review/adapterErrors.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/identity/CandidateReadAccess/index.js`; `ReviewTargetLockedError` is not a constructor.

- [ ] **Step 3: Add the errors and the read shape**

In `packages/api-workflows/src/domain/review/errors.ts`, add `import type { WorkflowBlockingReview } from "~/domain/workflow/types.js";` to the imports and append:

```ts
export type ReviewTargetLockedAction = "update" | "move";

export interface ReviewTargetLockedErrorData {
    reviewId: string;
    /** Namespace id of the target. */
    model: string;
    targetRevisionId: string;
    reviewState: ReviewState;
    action: ReviewTargetLockedAction;
}

/**
 * The target cannot change while its review is active: updates are blocked for any active review,
 * including approved and rejected ones (D62, D80); moves only while it is in progress (D84).
 * Thrown by the app adapters' handlers on bound models (R54, R55).
 */
export class ReviewTargetLockedError extends BaseError<ReviewTargetLockedErrorData> {
    override readonly code = "Workflows/Review/TargetLocked" as const;

    constructor(data: ReviewTargetLockedErrorData) {
        super({
            message:
                data.action === "move"
                    ? "This content cannot be moved to another folder while its review is in progress."
                    : `This content cannot be changed while its review is active (review state "${data.reviewState}"). Create a new revision to make changes.`,
            data
        });
    }
}

export interface ReviewPublishBlockedErrorData {
    /** Namespace id of the target. */
    model: string;
    targetRevisionId: string;
    /** The workflow bound to the model. */
    workflowId: string;
    /** State of the revision's active review; `null` when it has none. */
    reviewState: ReviewState | null;
}

/**
 * On a workflow-bound model a revision is published only with an approved review (D79); thrown by
 * the app adapters' publish handlers (R53). Creating content as published is not a publish and is
 * not blocked (D134 point 2).
 */
export class ReviewPublishBlockedError extends BaseError<ReviewPublishBlockedErrorData> {
    override readonly code = "Workflows/Review/PublishBlocked" as const;

    constructor(data: ReviewPublishBlockedErrorData) {
        super({
            message: data.reviewState
                ? `This content can only be published after its review is approved. The review is "${data.reviewState}".`
                : "This content can only be published after its review is approved. Request a review first.",
            data
        });
    }
}

export type ReviewActiveOnTrashAction = "trash" | "delete";

export interface ReviewActiveOnTrashErrorData {
    /** Namespace id of the targets. */
    model: string;
    action: ReviewActiveOnTrashAction;
    /**
     * Every in-progress review the action would end, each with its target, title and current
     * step; one target for trash and delete, possibly several for `deleteMultiple`.
     */
    reviews: WorkflowBlockingReview[];
}

/**
 * Trashing or deleting content with a review in progress is refused (D134); the admin warns and,
 * on confirm, calls the app's cancel-for-delete wrapper and repeats the action (R73, R74). Thrown
 * by the app adapters' trash and delete handlers on bound models.
 */
export class ReviewActiveOnTrashError extends BaseError<ReviewActiveOnTrashErrorData> {
    override readonly code = "Workflows/Review/ActiveReviewOnTrash" as const;

    constructor(data: ReviewActiveOnTrashErrorData) {
        super({
            message:
                data.action === "trash"
                    ? "This content has a review in progress. Trashing it cancels the review."
                    : "This content has a review in progress. Deleting it cancels the review.",
            data
        });
    }
}
```

Append to `packages/api-workflows/src/domain/review/types.ts`:

```ts
/** A review read by an app wrapper for one viewer (spec 5.3, R62). */
export interface ReviewWithViewerFlags {
    review: ReviewData;
    flags: ReviewViewerFlags;
}
```

- [ ] **Step 4: Add the `ReviewTargetReadAccess` port**

Create `packages/api-workflows/src/features/review/ReviewTargetReadAccess/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetUserReadParams {
    userId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface IReviewTargetReadAccess {
    /** Whether this adapter answers for the namespace. */
    canHandle(model: string): boolean;
    /**
     * Whether the user can read the target revision with the app's own permission logic (model,
     * folder and content access, D61, D133). The implementation reads the model and the revision as
     * the current identity and evaluates only the user's access as that user, through
     * `CandidateReadAccess` (R48, R67).
     */
    canUserRead(params: ReviewTargetUserReadParams): Promise<boolean>;
}

/**
 * The engine's question to a target adapter about another user (spec 6, 9.3; D133 point 4a). One
 * implementation per namespace, registered by the app adapters; the last registered match wins and
 * no match means no access (R50). Phase 4 asks it for candidates and reassign; the engine never
 * asks it about the caller, whose checks are the app wrappers'. Not to be confused with the 1b
 * `ReviewTargetAccess` flags type (`domain/review/types.ts`, R71).
 */
export const ReviewTargetReadAccess =
    createAbstraction<IReviewTargetReadAccess>("ReviewTargetReadAccess");

export namespace ReviewTargetReadAccess {
    export type Interface = IReviewTargetReadAccess;
    export type UserReadParams = ReviewTargetUserReadParams;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetReadAccess/index.ts`:

```ts
export { ReviewTargetReadAccess } from "./abstractions.js";
```

- [ ] **Step 5: Add `CandidateReadAccess`**

Create `packages/api-workflows/src/features/identity/CandidateReadAccess/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ICandidateReadAccess {
    /**
     * Runs `check` as the admin user `userId` of the current tenant, with authorization enabled
     * (also inside `withoutAuthorization`), and returns its answer. Returns `false` without running
     * `check` when the user is not an admin user of the current tenant, and `false` when anything
     * throws (fail closed). Read CMS models before calling, as the current identity (A19).
     */
    canUserRead(userId: string, check: () => Promise<boolean>): Promise<boolean>;
}

/**
 * A building block for the target adapters' `ReviewTargetReadAccess.canUserRead` (R48, R67): one
 * boolean read check for a candidate, nothing else. Not a general "run as" primitive and not
 * called by the api-workflows use cases (D132).
 */
export const CandidateReadAccess = createAbstraction<ICandidateReadAccess>("CandidateReadAccess");

export namespace CandidateReadAccess {
    export type Interface = ICandidateReadAccess;
}
```

Create `packages/api-workflows/src/features/identity/CandidateReadAccess/CandidateReadAccess.ts`:

```ts
import {
    AuthenticatedIdentity,
    IdentityContext,
    type Identity
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { CandidateReadAccess as Abstraction } from "./abstractions.js";

/**
 * The candidate's identity is built like the platform's own background identities
 * (`TaskControl`, `ExecuteScheduledActionUseCase`): an `admin` identity with tenant access, whose
 * roles and teams the authorizers load by id. Differences from a real login, accepted (A20):
 * - Only users stored as admin users of the current tenant are evaluated (one `GetUserUseCase`
 *   read, R68); anyone else is denied without a parent-tenant lookup. A user found here who has no
 *   roles in this tenant still gets `RolesTeamsAuthorizer`'s parent-tenant fallback, as at login.
 * - A custom identity provider's `canAccessTenant` rule is not re-run; the stored user record is
 *   the membership proof.
 * - Roles and teams are the stored ones, synced from the identity provider at the user's last
 *   login (`ExternalIdpUserSyncHandler`).
 * One identity object per tenant and user is kept for the request, so api-core's permission cache
 * (keyed by identity object and tenant, R69) loads each candidate once.
 */
class CandidateReadAccessImpl implements Abstraction.Interface {
    private readonly identities = new Map<string, Identity | null>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private getUser: GetUserUseCase.Interface
    ) {}

    public async canUserRead(userId: string, check: () => Promise<boolean>): Promise<boolean> {
        try {
            const identity = await this.getCandidateIdentity(userId);
            if (!identity) {
                return false;
            }
            return await this.identityContext.withIdentity(identity, () => {
                return this.identityContext.withAuthorization(check);
            });
        } catch {
            return false;
        }
    }

    private async getCandidateIdentity(userId: string): Promise<Identity | null> {
        const key = `${this.tenantContext.getTenant().id}:${userId}`;
        if (this.identities.has(key)) {
            return this.identities.get(key) ?? null;
        }

        // A membership lookup, not an access decision: read as the system.
        const user = await this.identityContext.withoutAuthorization(() => {
            return this.getUser.execute({ id: userId });
        });
        const identity = user.isOk()
            ? new AuthenticatedIdentity({
                  id: user.value.id,
                  displayName: user.value.displayName,
                  type: "admin",
                  context: { canAccessTenant: true }
              })
            : null;
        this.identities.set(key, identity);
        return identity;
    }
}

export const CandidateReadAccess = Abstraction.createImplementation({
    implementation: CandidateReadAccessImpl,
    dependencies: [IdentityContext, TenantContext, GetUserUseCase]
});
```

Create `packages/api-workflows/src/features/identity/CandidateReadAccess/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CandidateReadAccess } from "./CandidateReadAccess.js";

export const CandidateReadAccessFeature = createFeature({
    name: "Workflows/CandidateReadAccess",
    register(container) {
        // One instance per request container, so candidate identities are reused (R69).
        container.register(CandidateReadAccess).inSingletonScope();
    }
});
```

Create `packages/api-workflows/src/features/identity/CandidateReadAccess/index.ts`:

```ts
export { CandidateReadAccess } from "./abstractions.js";
```

- [ ] **Step 6: Register and pin the registration**

In `packages/api-workflows/src/WorkflowsFeature.ts` import `CandidateReadAccessFeature` from `~/features/identity/CandidateReadAccess/feature.js` and register it after `CurrentReviewViewerFeature.register(container);`.

In `packages/api-workflows/__tests__/registration.test.ts` import `CandidateReadAccess` from `~/features/identity/CandidateReadAccess/index.js` and `ReviewTargetReadAccess` from `~/features/review/ReviewTargetReadAccess/index.js`; change the comment above the loader/sync expectations to `// No default loader, sync or target read access: the app adapters register one per namespace.` and add:

```ts
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(0);
        expect(container.resolveAll(CandidateReadAccess)).toHaveLength(1);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): add the target read access port, candidate read access and adapter errors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
