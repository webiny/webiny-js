### Task 6: `ReviewTargetAccess` port, `RunAsUser`, adapter errors

D61, D133 point 4a, R48, R50, R53-R55, R62. Three small engine pieces the adapters need:

- `ReviewTargetAccess`: the engine's port for "can this user read the target" (one implementation per namespace, beside `ReviewTargetLoader` and `ReviewTargetSync`). Phase 4 consumes it for candidates and reassign; phase 2 registers and tests the implementations.
- `RunAsUser`: runs a callback as another user (an `admin` identity built from the user id, A20), so an adapter can evaluate its own read check for that user. Correct only with Task 1.
- Shared errors for both adapters (`Workflows/Review/TargetLocked`, `Workflows/Review/PublishBlocked`) and the `ReviewWithViewerFlags` read shape the get-review wrappers return.

**Files:**
- Create: `packages/api-workflows/src/features/review/ReviewTargetAccess/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetAccess/index.ts`
- Create: `packages/api-workflows/src/features/identity/RunAsUser/abstractions.ts`
- Create: `packages/api-workflows/src/features/identity/RunAsUser/RunAsUser.ts`
- Create: `packages/api-workflows/src/features/identity/RunAsUser/feature.ts`
- Create: `packages/api-workflows/src/features/identity/RunAsUser/index.ts`
- Modify: `packages/api-workflows/src/domain/review/errors.ts`
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/identity/RunAsUser.test.ts`
- Create: `packages/api-workflows/__tests__/review/adapterErrors.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `IdentityContext.withIdentity`, `AuthenticatedIdentity` (api-core), `ReviewState`, `ReviewData`, `ReviewViewerFlags`.
- Produces:
  - `ReviewTargetAccess.Interface { canAccess(model: string): boolean; canUserRead(params: ReviewTargetUserReadParams): Promise<boolean> }`, `ReviewTargetUserReadParams { userId: string; model: string; targetId: string; targetRevisionId: string }`.
  - `RunAsUser.Interface { run<T>(userId: string, cb: () => Promise<T>): Promise<T> }`.
  - `ReviewTargetLockedError` (`Workflows/Review/TargetLocked`), data `ReviewTargetLockedErrorData { reviewId; model; targetRevisionId; reviewState: ReviewState; action: ReviewTargetLockedAction }`, `ReviewTargetLockedAction = "update" | "move"`.
  - `ReviewPublishBlockedError` (`Workflows/Review/PublishBlocked`), data `ReviewPublishBlockedErrorData { model; targetRevisionId; workflowId; reviewState: ReviewState | null }`.
  - `ReviewWithViewerFlags { review: ReviewData; flags: ReviewViewerFlags }` (`domain/review/types.ts`).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/identity/RunAsUser.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { RunAsUser } from "~/features/identity/RunAsUser/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";

/** The default identity of `createCmsTestHandler`. */
const DEFAULT_USER_ID = "id-12345678";

const createRunAsUserContext = async () => {
    const { context } = await createContextHandler({
        // The request identity has no workflows permission; "user-editor" has `editor`.
        permissions: [{ name: "content.i18n" }],
        permissionsByIdentity: {
            "user-editor": [{ name: "workflows", editor: true }]
        }
    });
    return {
        runAsUser: context.container.resolve(RunAsUser),
        permissions: context.container.resolve(WorkflowsPermissions),
        identityContext: context.container.resolve(IdentityContext)
    };
};

describe("RunAsUser", () => {
    it("runs the callback as the given user", async () => {
        const { runAsUser, permissions, identityContext } = await createRunAsUserContext();

        const inside = await runAsUser.run("user-editor", async () => {
            const identity = identityContext.getIdentity();
            return {
                id: identity.id,
                type: identity.type,
                canEdit: await permissions.canEdit()
            };
        });

        expect(inside).toEqual({ id: "user-editor", type: "admin", canEdit: true });
    });

    it("restores the request identity and its permissions afterwards", async () => {
        const { runAsUser, permissions, identityContext } = await createRunAsUserContext();
        expect(await permissions.canEdit()).toBe(false);

        await runAsUser.run("user-editor", () => permissions.canEdit());

        expect(identityContext.getIdentity().id).toBe(DEFAULT_USER_ID);
        expect(await permissions.canEdit()).toBe(false);
    });

    it("grants nothing to a user without permissions", async () => {
        const { runAsUser, permissions } = await createRunAsUserContext();

        const canEdit = await runAsUser.run("user-unknown", () => permissions.canEdit());

        expect(canEdit).toBe(false);
    });
});
```

Create `packages/api-workflows/__tests__/review/adapterErrors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ReviewPublishBlockedError, ReviewTargetLockedError } from "~/domain/review/errors.js";

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
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/identity/RunAsUser.test.ts packages/api-workflows/__tests__/review/adapterErrors.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/identity/RunAsUser/index.js`; `ReviewTargetLockedError` is not a constructor.

- [ ] **Step 3: Add the errors and the read shape**

Append to `packages/api-workflows/src/domain/review/errors.ts`:

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
 * Thrown by the app adapters' handlers (R54, R55).
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
 * the app adapters' publish handlers (R53).
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
```

Append to `packages/api-workflows/src/domain/review/types.ts`:

```ts
/** A review read by an app wrapper for one viewer (spec 5.3, R62). */
export interface ReviewWithViewerFlags {
    review: ReviewData;
    flags: ReviewViewerFlags;
}
```

- [ ] **Step 4: Add the `ReviewTargetAccess` port**

Create `packages/api-workflows/src/features/review/ReviewTargetAccess/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ReviewTargetUserReadParams {
    userId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface IReviewTargetAccess {
    /** Whether this adapter answers for the namespace. */
    canAccess(model: string): boolean;
    /**
     * Whether the user can read the target revision with the app's own permission logic (model,
     * folder and content access, D61, D133). The implementation reads the model and the revision as
     * the current identity and evaluates only the user's access as that user (R48).
     */
    canUserRead(params: ReviewTargetUserReadParams): Promise<boolean>;
}

/**
 * The engine's question to a target adapter about another user (spec 6, 9.3; D133 point 4a). One
 * implementation per namespace, registered by the app adapters; the last registered match wins and
 * no match means no access (R50). Phase 4 asks it for candidates and reassign; the engine never
 * asks it about the caller, whose checks are the app wrappers'.
 */
export const ReviewTargetAccess = createAbstraction<IReviewTargetAccess>("ReviewTargetAccess");

export namespace ReviewTargetAccess {
    export type Interface = IReviewTargetAccess;
    export type UserReadParams = ReviewTargetUserReadParams;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetAccess/index.ts`:

```ts
export { ReviewTargetAccess } from "./abstractions.js";
export type { ReviewTargetUserReadParams } from "./abstractions.js";
```

- [ ] **Step 5: Add `RunAsUser`**

Create `packages/api-workflows/src/features/identity/RunAsUser/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface IRunAsUser {
    /**
     * Runs `cb` with the given admin user as the current identity (`IdentityContext.withIdentity`),
     * so permission checks inside answer for that user. Do not read CMS models inside `cb` (A19):
     * load them as the current identity first.
     */
    run<T>(userId: string, cb: () => Promise<T>): Promise<T>;
}

/**
 * A building block for the target adapters' `ReviewTargetAccess.canUserRead` (R48). Not called by
 * the api-workflows use cases (D132).
 */
export const RunAsUser = createAbstraction<IRunAsUser>("RunAsUser");

export namespace RunAsUser {
    export type Interface = IRunAsUser;
}
```

Create `packages/api-workflows/src/features/identity/RunAsUser/RunAsUser.ts`:

```ts
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { RunAsUser as Abstraction } from "./abstractions.js";

/**
 * Candidates are admin users of the current tenant (team members), so the identity is an `admin`
 * with tenant access (A20). The authorizers load the user's roles and teams by id; an unknown id
 * gets no permissions. Correct only because api-core caches permissions per identity (R49).
 */
class RunAsUserImpl implements Abstraction.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public run<T>(userId: string, cb: () => Promise<T>): Promise<T> {
        const identity = new AuthenticatedIdentity({
            id: userId,
            displayName: userId,
            type: "admin",
            context: { canAccessTenant: true }
        });
        return this.identityContext.withIdentity(identity, cb);
    }
}

export const RunAsUser = Abstraction.createImplementation({
    implementation: RunAsUserImpl,
    dependencies: [IdentityContext]
});
```

Create `packages/api-workflows/src/features/identity/RunAsUser/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RunAsUser } from "./RunAsUser.js";

export const RunAsUserFeature = createFeature({
    name: "Workflows/RunAsUser",
    register(container) {
        container.register(RunAsUser);
    }
});
```

Create `packages/api-workflows/src/features/identity/RunAsUser/index.ts`:

```ts
export { RunAsUser } from "./abstractions.js";
```

- [ ] **Step 6: Register and pin the registration**

In `packages/api-workflows/src/WorkflowsFeature.ts` import `RunAsUserFeature` from `~/features/identity/RunAsUser/feature.js` and register it after `CurrentReviewViewerFeature.register(container);`.

In `packages/api-workflows/__tests__/registration.test.ts` import `RunAsUser` from `~/features/identity/RunAsUser/index.js` and `ReviewTargetAccess` from `~/features/review/ReviewTargetAccess/index.js`; change the comment above the loader/sync expectations to `// No default loader, sync or target access: the app adapters register one per namespace.` and add:

```ts
        expect(container.resolveAll(ReviewTargetAccess)).toHaveLength(0);
        expect(container.resolveAll(RunAsUser)).toHaveLength(1);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): add the target access port, RunAsUser and adapter errors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
