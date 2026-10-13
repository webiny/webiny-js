### Task 10: WB review list, target review, request title, assignment entries

Spec 10, 11, D47, D76, D89, D94, D112, D119, D127, D133, D135; R87, R89, R91, R92, R94, R95, R96, R106, R108. The Website Builder side of what Task 7 builds for the CMS, over the phase 2 wrappers in `packages/api-website-builder-workflows/src/features/wrappers`:

- `ListWebsiteBuilderPageReviewsUseCase`: reads the viewer, refuses `failedSteps` without `reassign` before the engine (R95), calls `ListReviewsUseCase` with the viewer's ids, `models: ["wb.page"]` and an inline `canRead` arrow (`WbPageTargetReader.read` + `entryId` match + `WbPageAccess.canRead`; a throw counts as unreadable in the engine, R92), and attaches `getReviewViewerFlags` per row (A43).
- `GetWebsiteBuilderPageTargetReviewUseCase({ targetRevisionId })`: read access to the page revision first (missing, trashed or unreadable is `Workflows/NotAuthorized` with `"view this review"`, R108), then `GetTargetReviewUseCase`; `null` without an active review.
- `RequestWebsiteBuilderPageReviewUseCase` passes the optional `title` to the engine (R89; the engine trims and validates it).
- `GetWebsiteBuilderPageReviewUseCase` and the target-review wrapper read the assignment log (`ListReviewAssignmentsUseCase`), drop `kind: "skip"` records unless the viewer has `editor` or `reassign` (`redactAssignmentRecords`, pure) and attach the records to their steps (pure `attachAssignmentRecords`, 3.1 Task 4). A failed log read fails the get with `Workflows/Assignment/Persistence` (R87, R96).

Every dependency throw in the new wrappers becomes `Workflows/Review/Persistence` (R87). Dependencies are called inline in `execute`; the only shared code is api-workflows' pure `attachAssignmentRecords` (3.1 Task 4).

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/ListWebsiteBuilderPageReviewsUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/index.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/GetWebsiteBuilderPageTargetReviewUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/index.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/abstractions.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/GetWebsiteBuilderPageReviewUseCase.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/abstractions.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/RequestWebsiteBuilderPageReviewUseCase.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/FailingListReviewAssignments.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/assignments.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/requestTitle.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes (3.1, as `00-shared.md` fixes them; import paths follow the api-workflows layout):
  - `ListReviewsUseCase` (`@webiny/api-workflows/features/review/ListReviews/index.js`), `execute(input: ListReviewsUseCase.Input): ListReviewsUseCase.Return` with `Input` = `ListReviewsInput { list: ReviewListKind; viewerUserId: string; viewerTeamIds: string[]; models: string[]; where?: ReviewListWhere | null; sort?: ReviewListSort | null; limit?: number | null; after?: string | null; canRead: ReviewReadPredicate }` and `Return = Promise<Result<ListReviewsOutput, ListReviewsUseCase.Error>>`, `ListReviewsOutput { items: ReviewData[]; meta: ReviewListMeta }` (`ReviewValidationError`, `ReviewPersistenceError`).
  - `ReviewListKind`, `ReviewListSort` (`"lastChangedOn_ASC" | "lastChangedOn_DESC"`), `ReviewListWhere { titleContains?: string | null; reviewState?: ReviewState | null; stepState?: StepState | null }`, `ReviewListMeta { cursor: string | null; hasMoreItems: boolean }`, `ReviewData.currentStepType: string | null` (`@webiny/api-workflows/domain/review/types.js`, Tasks 1 and 3).
  - `ListReviewAssignmentsUseCase` (`@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js`), `execute(input: { reviewId: string }): Promise<Result<AssignmentRecord[], AssignmentPersistenceError>>`, newest first; namespace `Input`, `Return`, `Error` (Task 4).
  - `AssignmentRecordKind = "outcome" | "skip"`, `AssignmentRecordValues.kind: AssignmentRecordKind` (`@webiny/api-workflows/domain/assignment/types.js`), `redactAssignmentRecords(records: AssignmentRecord[], permissions: WorkflowsPermissionSet): AssignmentRecord[]` (`@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js`) (Task 4).
  - `RequestReviewInput.title?: string | null` (Task 2): trimmed, at least 5 characters when non-empty (`Workflows/Review/Validation`, "The review title must have at least 5 characters."), the target's title when missing or empty.
  - 3.1 Task 4 (api-workflows, shared by both apps): `ReviewStepWithAssignments extends ReviewStep { assignments: AssignmentRecord[] }`, `ReviewWithAssignments extends Omit<ReviewData, "steps"> { steps: ReviewStepWithAssignments[] }`, `ReviewWithAssignmentsAndViewerFlags { review: ReviewWithAssignments; flags: ReviewViewerFlags }` (`@webiny/api-workflows/domain/assignment/types.js`); pure `attachAssignmentRecords(review: ReviewData, records: AssignmentRecord[]): ReviewWithAssignments` (`@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js`).
  - Existing: `CurrentReviewViewer`, `GetTargetReviewUseCase`, `getReviewViewerFlags`, `canReassignByPermission`, `WorkflowsNotAuthorizedError`, `ReviewPersistenceError`, `WbPageTargetReader`, `WbPageAccess`, `WbPageReviewGuardService`, `ReviewRepository` (tests), `AssignmentRepository` (tests).
- Produces:
  - `ListWebsiteBuilderPageReviewsUseCase.Interface.execute(input: ListWebsiteBuilderPageReviewsInput): Promise<Result<ListWebsiteBuilderPageReviewsOutput, Error>>`, `ListWebsiteBuilderPageReviewsInput { list: ReviewListKind; where?: ReviewListWhere | null; sort?: ReviewListSort | null; limit?: number | null; after?: string | null }`, `ListWebsiteBuilderPageReviewsOutput { items: ReviewWithViewerFlags[]; meta: ReviewListMeta }`; errors `Workflows/NotAuthenticated`, `Workflows/NotAuthorized` (`{ action: "list failed steps" }`), `ListReviewsUseCase.Error`.
  - `GetWebsiteBuilderPageTargetReviewUseCase.Interface.execute(input: GetWebsiteBuilderPageTargetReviewInput): Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, Error>>`, `GetWebsiteBuilderPageTargetReviewInput { targetRevisionId: string }`; errors `Workflows/NotAuthenticated`, `Workflows/NotAuthorized` (`{ action: "view this review" }`), `Workflows/Review/Persistence`, `Workflows/Assignment/Persistence`.
  - `GetWebsiteBuilderPageReviewUseCase` now returns `ReviewWithAssignmentsAndViewerFlags` (was `ReviewWithViewerFlags`) and adds `Workflows/Assignment/Persistence`.
  - `RequestWebsiteBuilderPageReviewInput.title?: string | null`.

- [ ] **Step 1: Write the test helpers**

In `packages/api-website-builder-workflows/__tests__/__helpers/CountingEngineCalls.ts`, add these imports after the `DeleteTargetReviewsUseCase` import:

```ts
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
```

Add these classes after `class CountingCancelReview`:

```ts
class CountingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(input: GetTargetReviewUseCase.Input): GetTargetReviewUseCase.Return {
        engineCalls.push("GetTargetReview");
        return this.decoratee.execute(input);
    }
}

class CountingListReviews implements ListReviewsUseCase.Interface {
    public constructor(private decoratee: ListReviewsUseCase.Interface) {}

    public async execute(input: ListReviewsUseCase.Input): ListReviewsUseCase.Return {
        engineCalls.push("ListReviews");
        return this.decoratee.execute(input);
    }
}

class CountingListReviewAssignments implements ListReviewAssignmentsUseCase.Interface {
    public constructor(private decoratee: ListReviewAssignmentsUseCase.Interface) {}

    public async execute(
        input: ListReviewAssignmentsUseCase.Input
    ): ListReviewAssignmentsUseCase.Return {
        engineCalls.push("ListReviewAssignments");
        return this.decoratee.execute(input);
    }
}
```

At the end of `countEngineCalls`, after the `CancelReviewUseCase` decorator, add:

```ts
    container.registerDecorator(
        GetTargetReviewUseCase.createDecorator({
            decorator: CountingGetTargetReview,
            dependencies: []
        })
    );
    container.registerDecorator(
        ListReviewsUseCase.createDecorator({ decorator: CountingListReviews, dependencies: [] })
    );
    container.registerDecorator(
        ListReviewAssignmentsUseCase.createDecorator({
            decorator: CountingListReviewAssignments,
            dependencies: []
        })
    );
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/FailingListReviewAssignments.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { AssignmentPersistenceError } from "@webiny/api-workflows/domain/assignment/errors.js";

class FailingListReviewAssignments implements ListReviewAssignmentsUseCase.Interface {
    public constructor(private decoratee: ListReviewAssignmentsUseCase.Interface) {}

    public async execute(): ListReviewAssignmentsUseCase.Return {
        return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
    }
}

/** The assignment log read fails (`legacyPlugins`). */
export const failListReviewAssignments = (container: Container) => {
    container.registerDecorator(
        ListReviewAssignmentsUseCase.createDecorator({
            decorator: FailingListReviewAssignments,
            dependencies: []
        })
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/__helpers/assignments.ts`:

```ts
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { AssignmentRecord } from "@webiny/api-workflows/domain/assignment/types.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { AssignmentRepository } from "@webiny/api-workflows/domain/assignment/abstractions/AssignmentRepository.js";
import { expectOk } from "./pages.js";
import { STEP_ID } from "./engine.js";
import { REVIEWER } from "./identities.js";

export interface SeededAssignments {
    /** Pool fall-through, newest (10:00). */
    outcome: AssignmentRecord;
    /** REVIEWER's excluded pick, older (09:00). */
    skip: AssignmentRecord;
}

/**
 * Two assignment-log records of the review's only step, written straight to the repository:
 * nothing writes the log before phase 4 (A44).
 */
export const seedAssignments = async (
    context: CmsContext,
    review: ReviewData
): Promise<SeededAssignments> => {
    const repository = context.container.resolve(AssignmentRepository);
    const outcome = expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: null,
            assignedOn: "2026-10-13T10:00:00.000Z",
            source: "pool",
            by: null,
            reason: null,
            kind: "outcome"
        })
    );
    const skip = expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: REVIEWER.id,
            assignedOn: "2026-10-13T09:00:00.000Z",
            source: "picked",
            by: null,
            reason: "pick excluded",
            kind: "skip"
        })
    );
    return { outcome, skip };
};
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewWithViewerFlags } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, startPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    OTHER_REVIEWER,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    nullTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { ListWebsiteBuilderPageReviewsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";
import type { ListWebsiteBuilderPageReviewsInput } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";

/**
 * Admin stores the pages workflow; REQUESTER's reviews of a root page and of a page in
 * "folder-locked" (both awaiting team-1), then a Headless CMS review in the same team.
 */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const review = await requestPageReview(admin, page);
    // The order tests compare `lastChangedOn`; keep the two requests in different milliseconds.
    await new Promise(resolve => setTimeout(resolve, 5));
    const lockedReview = await requestPageReview(admin, lockedPage);
    const cmsReview = await createCmsReview(admin);
    return { admin, page, lockedPage, review, lockedReview, cmsReview };
};

/** A context as the identity that counts the engine's calls; setup contexts do not. */
const asUser = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return createUserContext({
        identity,
        permissions,
        legacyPlugins: [countEngineCalls, scriptTargetReads, throwOnAccessChecks]
    });
};

const list = (context: CmsContext, input: ListWebsiteBuilderPageReviewsInput) => {
    return context.container.resolve(ListWebsiteBuilderPageReviewsUseCase).execute(input);
};

const reviewIds = (rows: ReviewWithViewerFlags[]): string[] => {
    return rows.map(row => row.review.id);
};

describe("WB review list wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        nullTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("lists the pool of page reviews with the viewer's flags, never a Headless CMS review (R46)", async () => {
        const { review, lockedReview, cmsReview } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(reviewIds(result.items)).toEqual([review.id, lockedReview.id]);
        expect(reviewIds(result.items)).not.toContain(cmsReview.id);
        expect(result.items[0].flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(result.meta.hasMoreItems).toBe(false);
        expect(engineCalls).toEqual(["ListReviews"]);
    });

    it("does not list a review of a page in a folder the viewer cannot read (D76)", async () => {
        const { review } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(reviewIds(result.items)).toEqual([review.id]);
    });

    it("does not list a page review without page read permission", async () => {
        await createScenario();
        const reviewer = await asUser(REVIEWER, []);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(result.items).toEqual([]);
        expect(engineCalls).toEqual(["ListReviews"]);
    });

    it("skips rows whose page is missing, another page's or unreadable because a read throws", async () => {
        const { page, lockedPage } = await createScenario();
        mismatchedTargetRevisions.add(page.id);
        throwingTargetRevisions.add(lockedPage.id);
        const reviewer = await asUser(REVIEWER, WB_READER);

        const mismatchedAndThrowing = expectOk(await list(reviewer, { list: "pool" }));
        mismatchedTargetRevisions.clear();
        throwingTargetRevisions.clear();
        nullTargetRevisions.add(page.id);
        throwingAccessChecks.add("canRead");
        const missingAndCheckThrowing = expectOk(await list(reviewer, { list: "pool" }));

        expect(mismatchedAndThrowing.items).toEqual([]);
        expect(missingAndCheckThrowing.items).toEqual([]);
    });

    it("lists my requests newest first (D119)", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = expectOk(await list(requester, { list: "myRequests" }));

        expect(reviewIds(result.items)).toEqual([lockedReview.id, review.id]);
        expect(result.items[0].flags.canCancel).toBe(true);
    });

    it("filters my requests by review state and refuses state filters on other lists (R91)", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reviewer = await asUser(REVIEWER, WB_READER);

        const inProgress = expectOk(
            await list(requester, { list: "myRequests", where: { reviewState: "inProgress" } })
        );
        const approved = expectOk(
            await list(requester, { list: "myRequests", where: { reviewState: "approved" } })
        );
        const refused = await list(reviewer, { list: "pool", where: { stepState: "awaiting" } });

        expect(reviewIds(inProgress.items)).toEqual([lockedReview.id, review.id]);
        expect(approved.items).toEqual([]);
        expect(refused.error.code).toBe("Workflows/Review/Validation");
    });

    it("lists assigned to me and team in review once a reviewer started a step", async () => {
        const { admin, review, lockedReview } = await createScenario();
        await startPageReview(admin, review);
        const reviewer = await asUser(REVIEWER, WB_READER);
        const otherReviewer = await asUser(OTHER_REVIEWER, WB_READER);

        const assigned = expectOk(await list(reviewer, { list: "assignedToMe" }));
        const teamInReview = expectOk(await list(otherReviewer, { list: "teamInReview" }));
        const pool = expectOk(await list(otherReviewer, { list: "pool" }));

        expect(reviewIds(assigned.items)).toEqual([review.id]);
        expect(assigned.items[0].flags).toMatchObject({ canApprove: true, canReject: true });
        expect(reviewIds(teamInReview.items)).toEqual([review.id]);
        expect(teamInReview.items[0].flags).toMatchObject({ canTakeOver: true, canApprove: false });
        expect(reviewIds(pool.items)).toEqual([lockedReview.id]);
    });

    it("filters by title", async () => {
        const { lockedReview } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(
            await list(reviewer, { list: "pool", where: { titleContains: "Locked" } })
        );

        expect(reviewIds(result.items)).toEqual([lockedReview.id]);
    });

    it("pages with the engine's cursor without losing or repeating a row (R92)", async () => {
        const { review, lockedReview } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const first = expectOk(await list(reviewer, { list: "pool", limit: 1 }));
        const second = expectOk(
            await list(reviewer, { list: "pool", limit: 1, after: first.meta.cursor })
        );

        expect(reviewIds(first.items)).toEqual([review.id]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(typeof first.meta.cursor).toBe("string");
        expect(reviewIds(second.items)).toEqual([lockedReview.id]);
        expect(second.meta.hasMoreItems).toBe(false);
    });

    it("refuses the failed steps list without reassign, before the engine (R95)", async () => {
        await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await list(reviewer, { list: "failedSteps" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list failed steps" });
        expect(engineCalls).toEqual([]);
    });

    it("lists a failed AI step for a viewer with reassign (D112)", async () => {
        const { admin, review } = await createScenario();
        // Nothing produces a failed step before phase 5 (R93): seed it in storage.
        expectOk(
            await admin.container.resolve(ReviewRepository).save({
                ...review,
                currentStepState: "failed",
                currentStepType: "ai",
                steps: review.steps.map(step => {
                    return { ...step, type: "ai", state: "failed" };
                })
            })
        );
        const reassigner = await asUser(REASSIGNER, [...WB_READER, WORKFLOWS_REASSIGN]);

        const result = expectOk(await list(reassigner, { list: "failedSteps" }));

        expect(reviewIds(result.items)).toEqual([review.id]);
        expect(engineCalls).toEqual(["ListReviews"]);
    });

    it("refuses an anonymous identity, before the engine", async () => {
        await createScenario();
        const anonymous = await asUser(null, []);

        const result = await list(anonymous, { list: "pool" });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { seedAssignments } from "~tests/__helpers/assignments.js";
import {
    EDITOR,
    NOBODY,
    REASSIGNER,
    REVIEWER,
    WB_READER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { failListReviewAssignments } from "~tests/__helpers/FailingListReviewAssignments.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";

/**
 * Admin stores the pages workflow; REQUESTER's review of a root page with two seeded log records,
 * a locked page with a review, and a page without one.
 */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    await requestPageReview(admin, lockedPage);
    const assignments = await seedAssignments(admin, review);
    return { admin, page, lockedPage, quietPage, review, assignments };
};

const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
) => {
    return createUserContext({
        identity,
        permissions,
        legacyPlugins: [countEngineCalls, scriptTargetReads, throwOnAccessChecks, ...legacyPlugins]
    });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetWebsiteBuilderPageReviewUseCase).execute({ id });
};

const getTargetReview = (context: CmsContext, targetRevisionId: string) => {
    return context.container
        .resolve(GetWebsiteBuilderPageTargetReviewUseCase)
        .execute({ targetRevisionId });
};

describe("WB target review and assignment entries", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("drops skip entries from the review read for a plain reviewer (D89, D127)", async () => {
        const { review, assignments } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await getReview(reviewer, review.id));

        expect(result.review.steps[0].assignments.map(record => record.id)).toEqual([
            assignments.outcome.id
        ]);
        expect(result.flags.canStart).toBe(true);
        expect(engineCalls).toEqual(["GetReview", "ListReviewAssignments"]);
    });

    it("keeps skip entries for editor and reassign, newest first", async () => {
        const { review, assignments } = await createScenario();
        const editor = await asUser(EDITOR, [...WB_READER, WORKFLOWS_EDITOR]);
        const reassigner = await asUser(REASSIGNER, [...WB_READER, WORKFLOWS_REASSIGN]);

        const asEditor = expectOk(await getReview(editor, review.id));
        const asReassigner = expectOk(await getReview(reassigner, review.id));

        const expected = [assignments.outcome.id, assignments.skip.id];
        expect(asEditor.review.steps[0].assignments.map(record => record.id)).toEqual(expected);
        expect(asReassigner.review.steps[0].assignments.map(record => record.id)).toEqual(
            expected
        );
        expect(asEditor.review.steps[0].assignments[1]).toMatchObject({
            kind: "skip",
            userId: REVIEWER.id,
            reason: "pick excluded"
        });
    });

    it("fails get review with the assignment persistence error when the log read fails (R87)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [failListReviewAssignments]);

        const result = await getReview(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/Assignment/Persistence");
    });

    it("returns the active review of a page revision with flags and redacted entries", async () => {
        const { page, review, assignments } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await getTargetReview(reviewer, page.id));

        expect(result?.review.id).toBe(review.id);
        expect(result?.flags.canStart).toBe(true);
        expect(result?.review.steps[0].assignments.map(record => record.id)).toEqual([
            assignments.outcome.id
        ]);
        expect(engineCalls).toEqual(["GetTargetReview", "ListReviewAssignments"]);
    });

    it("keeps skip entries in the target review for an editor", async () => {
        const { page, assignments } = await createScenario();
        const editor = await asUser(EDITOR, [...WB_READER, WORKFLOWS_EDITOR]);

        const result = expectOk(await getTargetReview(editor, page.id));

        expect(result?.review.steps[0].assignments.map(record => record.id)).toEqual([
            assignments.outcome.id,
            assignments.skip.id
        ]);
    });

    it("returns null for a revision without an active review", async () => {
        const { quietPage } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await getTargetReview(reviewer, quietPage.id));

        expect(result).toBeNull();
        expect(engineCalls).toEqual(["GetTargetReview"]);
    });

    it("refuses a page the viewer cannot read, a missing revision, a trashed page and no page permission, before the engine (R108)", async () => {
        const { admin, page, lockedPage, quietPage } = await createScenario();
        expectOk(await admin.container.resolve(TrashPageUseCase).execute({ id: quietPage.id }));
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);
        const nobody = await asUser(NOBODY, []);

        const folderDenied = await getTargetReview(reviewer, lockedPage.id);
        const missing = await getTargetReview(reviewer, `${page.entryId}#0009`);
        const trashed = await getTargetReview(reviewer, quietPage.id);
        const permissionDenied = await getTargetReview(nobody, page.id);

        for (const result of [folderDenied, missing, trashed, permissionDenied]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "view this review" });
        }
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the target read or the read check throws (R87)", async () => {
        const { page } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        throwingTargetRevisions.add(page.id);
        const readThrows = await getTargetReview(reviewer, page.id);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canRead");
        const checkThrows = await getTargetReview(reviewer, page.id);

        expect(readThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(checkThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails the target review with the assignment persistence error when the log read fails (R87)", async () => {
        const { page } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [failListReviewAssignments]);

        const result = await getTargetReview(reviewer, page.id);

        expect(result.error.code).toBe("Workflows/Assignment/Persistence");
    });

    it("refuses an anonymous identity, before the engine", async () => {
        const { page } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await getTargetReview(anonymous, page.id);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/wrappers/requestTitle.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";
import { REQUESTER, WB_WRITER } from "~tests/__helpers/identities.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";

const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const requester = await createUserContext({
        identity: REQUESTER,
        permissions: WB_WRITER,
        legacyPlugins: [countEngineCalls]
    });
    return { admin, requester };
};

const request = (context: CmsContext, page: WbPage, title?: string | null) => {
    return context.container.resolve(RequestWebsiteBuilderPageReviewUseCase).execute({
        targetId: page.entryId,
        targetRevisionId: page.id,
        title
    });
};

describe("WB request review title (D135, R89)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("uses the requested title, trimmed", async () => {
        const { admin, requester } = await createScenario();
        const page = await createPage(admin, { title: "Page A" });

        const review = expectOk(await request(requester, page, "  Homepage launch  "));

        expect(review.title).toBe("Homepage launch");
    });

    it("refuses a title shorter than 5 characters", async () => {
        const { admin, requester } = await createScenario();
        const page = await createPage(admin, { title: "Page A" });

        const result = await request(requester, page, "Home");

        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
        expect(engineCalls).toEqual(["RequestReview"]);
    });

    it("uses the page title when the title is missing, null or empty", async () => {
        const { admin, requester } = await createScenario();
        const missing = await createPage(admin, { title: "Page without title" });
        const nulled = await createPage(admin, { title: "Page with null title" });
        const empty = await createPage(admin, { title: "Page with empty title" });

        const fromMissing = expectOk(await request(requester, missing));
        const fromNull = expectOk(await request(requester, nulled, null));
        const fromEmpty = expectOk(await request(requester, empty, "   "));

        expect(fromMissing.title).toBe("Page without title");
        expect(fromNull.title).toBe("Page with null title");
        expect(fromEmpty.title).toBe("Page with empty title");
    });
});
```

In `packages/api-website-builder-workflows/__tests__/registration.test.ts`, add after the `CancelWebsiteBuilderPageReviewsForDeleteUseCase` import:

```ts
import { ListWebsiteBuilderPageReviewsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";
```

and in `WRAPPERS`, after `CancelWebsiteBuilderPageReviewsForDeleteUseCase,`, add:

```ts
    ListWebsiteBuilderPageReviewsUseCase,
    GetWebsiteBuilderPageTargetReviewUseCase,
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts packages/api-website-builder-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts packages/api-website-builder-workflows/__tests__/wrappers/requestTitle.test.ts packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50`

Expected: FAIL. `listReviews.test.ts`, `targetReviewAndAssignments.test.ts` and `registration.test.ts` fail to load with `Failed to resolve import "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js"` (and `.../GetWebsiteBuilderPageTargetReview/index.js`); in `requestTitle.test.ts` "uses the requested title, trimmed" fails with `expected 'Page A' to be 'Homepage launch'` and "refuses a title shorter than 5 characters" fails because the request succeeds (`result.error` is undefined). Record the output.

- [ ] **Step 4: The list wrapper**

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ReviewListKind,
    ReviewListMeta,
    ReviewListSort,
    ReviewListWhere,
    ReviewWithViewerFlags
} from "@webiny/api-workflows/domain/review/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";

export interface ListWebsiteBuilderPageReviewsInput {
    list: ReviewListKind;
    /** `reviewState` and `stepState` only with `myRequests`; the engine refuses them elsewhere (R91). */
    where?: ReviewListWhere | null;
    /** Defaults per list: oldest first, newest first for `myRequests` (D119). */
    sort?: ReviewListSort | null;
    /** Default 20, at most 100 (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface ListWebsiteBuilderPageReviewsOutput {
    items: ReviewWithViewerFlags[];
    meta: ReviewListMeta;
}

export interface IListWebsiteBuilderPageReviewsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    list: ListReviewsUseCase.Error;
}

type UseCaseError =
    IListWebsiteBuilderPageReviewsUseCaseErrors[keyof IListWebsiteBuilderPageReviewsUseCaseErrors];

export interface IListWebsiteBuilderPageReviewsUseCase {
    execute(
        input: ListWebsiteBuilderPageReviewsInput
    ): Promise<Result<ListWebsiteBuilderPageReviewsOutput, UseCaseError>>;
}

/**
 * The viewer's page review lists (spec 11, D47, D133): `wb.page` reviews only, each row readable
 * by the viewer with Website Builder's own page and folder access (D76) and carrying the viewer's
 * flags. Failed steps need `reassign` (D112, R95).
 */
export const ListWebsiteBuilderPageReviewsUseCase =
    createAbstraction<IListWebsiteBuilderPageReviewsUseCase>(
        "ListWebsiteBuilderPageReviewsUseCase"
    );

export namespace ListWebsiteBuilderPageReviewsUseCase {
    export type Interface = IListWebsiteBuilderPageReviewsUseCase;
    export type Input = ListWebsiteBuilderPageReviewsInput;
    export type Output = ListWebsiteBuilderPageReviewsOutput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListWebsiteBuilderPageReviewsOutput, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/ListWebsiteBuilderPageReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { ListWebsiteBuilderPageReviewsUseCase as UseCase } from "./abstractions.js";

class ListWebsiteBuilderPageReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listReviews: ListReviewsUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }
        const reviewViewer = viewer.value;

        if (input.list === "failedSteps" && !canReassignByPermission(reviewViewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list failed steps" }));
        }

        const listed = await this.listReviews.execute({
            list: input.list,
            viewerUserId: reviewViewer.actor.id,
            viewerTeamIds: reviewViewer.teamIds,
            models: [WB_PAGE_NAMESPACE],
            where: input.where,
            sort: input.sort,
            limit: input.limit,
            after: input.after,
            // A missing page, another page's revision or no read access hides the row; the
            // engine counts a throw as unreadable (R92), so no title of a hidden page leaks (D76).
            canRead: async (review: ReviewData) => {
                const target = await this.targets.read({
                    model: review.model,
                    targetRevisionId: review.targetRevisionId
                });
                if (!target || target.page.entryId !== review.targetId) {
                    return false;
                }
                return this.access.canRead(target);
            }
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        // Every row passed the read predicate, so the flags apply as they are (A43).
        return Result.ok({
            items: listed.value.items.map(review => {
                return { review, flags: getReviewViewerFlags(review, reviewViewer) };
            }),
            meta: listed.value.meta
        });
    }
}

export const ListWebsiteBuilderPageReviewsUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageReviewsUseCaseImpl,
    dependencies: [CurrentReviewViewer, ListReviewsUseCase, WbPageTargetReader, WbPageAccess]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageReviewsUseCase } from "./ListWebsiteBuilderPageReviewsUseCase.js";

export const ListWebsiteBuilderPageReviewsFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageReviews",
    register(container) {
        container.register(ListWebsiteBuilderPageReviewsUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/ListWebsiteBuilderPageReviews/index.ts`:

```ts
export { ListWebsiteBuilderPageReviewsUseCase } from "./abstractions.js";
export type {
    ListWebsiteBuilderPageReviewsInput,
    ListWebsiteBuilderPageReviewsOutput
} from "./abstractions.js";
```

- [ ] **Step 5: The target review wrapper**

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import type { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";

export interface GetWebsiteBuilderPageTargetReviewInput {
    /** The page revision id (`<pageId>#<version>`). */
    targetRevisionId: string;
}

export interface IGetWebsiteBuilderPageTargetReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: ReviewPersistenceError;
    get: GetTargetReviewUseCase.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageTargetReviewUseCaseErrors[keyof IGetWebsiteBuilderPageTargetReviewUseCaseErrors];

export interface IGetWebsiteBuilderPageTargetReviewUseCase {
    execute(
        input: GetWebsiteBuilderPageTargetReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}

/**
 * The active review of a page revision for the reading user, or `null` (spec 10, D23). Needs read
 * access to the page, checked before the review is read; a missing page reads as unreadable, as
 * in the guard. Steps carry their assignment-log entries, redacted like the get by id (R96).
 */
export const GetWebsiteBuilderPageTargetReviewUseCase =
    createAbstraction<IGetWebsiteBuilderPageTargetReviewUseCase>(
        "GetWebsiteBuilderPageTargetReviewUseCase"
    );

export namespace GetWebsiteBuilderPageTargetReviewUseCase {
    export type Interface = IGetWebsiteBuilderPageTargetReviewUseCase;
    export type Input = GetWebsiteBuilderPageTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/GetWebsiteBuilderPageTargetReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { GetWebsiteBuilderPageTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageTargetReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface,
        private listAssignments: ListReviewAssignmentsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        // A missing or hidden page is unreadable, so the answer reveals nothing about which pages
        // exist; a failed read or access check is a persistence error (R87).
        let canRead: boolean;
        try {
            const target = await this.targets.read({
                model: WB_PAGE_NAMESPACE,
                targetRevisionId: input.targetRevisionId
            });
            canRead = !!target && (await this.access.canRead(target));
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canRead) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "view this review" }));
        }

        const review = await this.getTargetReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: input.targetRevisionId
        });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (!review.value) {
            return Result.ok(null);
        }

        const assignments = await this.listAssignments.execute({ reviewId: review.value.id });
        if (assignments.isFail()) {
            return Result.fail(assignments.error);
        }

        const visible = redactAssignmentRecords(assignments.value, viewer.value.permissions);
        return Result.ok({
            review: attachAssignmentRecords(review.value, visible),
            flags: getReviewViewerFlags(review.value, viewer.value)
        });
    }
}

export const GetWebsiteBuilderPageTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageTargetReviewUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WbPageTargetReader,
        WbPageAccess,
        GetTargetReviewUseCase,
        ListReviewAssignmentsUseCase
    ]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "./GetWebsiteBuilderPageTargetReviewUseCase.js";

export const GetWebsiteBuilderPageTargetReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageTargetReview",
    register(container) {
        container.register(GetWebsiteBuilderPageTargetReviewUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageTargetReview/index.ts`:

```ts
export { GetWebsiteBuilderPageTargetReviewUseCase } from "./abstractions.js";
export type { GetWebsiteBuilderPageTargetReviewInput } from "./abstractions.js";
```

- [ ] **Step 6: Assignment entries in the get review wrapper**

Replace `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/abstractions.ts` with:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";

export interface GetWebsiteBuilderPageReviewInput {
    id: string;
}

export interface IGetWebsiteBuilderPageReviewUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageReviewUseCaseErrors[keyof IGetWebsiteBuilderPageReviewUseCaseErrors];

export interface IGetWebsiteBuilderPageReviewUseCase {
    execute(
        input: GetWebsiteBuilderPageReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}

/**
 * A page review with the reading user's flags (spec 5.3, R62); needs read access to the target.
 * Each step carries its assignment-log entries (D127); per-user skip entries are dropped here, in
 * the wrapper and not in the resolver, for viewers without `editor` / `reassign` (spec 8, D89,
 * D133, R96).
 */
export const GetWebsiteBuilderPageReviewUseCase =
    createAbstraction<IGetWebsiteBuilderPageReviewUseCase>("GetWebsiteBuilderPageReviewUseCase");

export namespace GetWebsiteBuilderPageReviewUseCase {
    export type Interface = IGetWebsiteBuilderPageReviewUseCase;
    export type Input = GetWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}
```

Replace `packages/api-website-builder-workflows/src/features/wrappers/GetWebsiteBuilderPageReview/GetWebsiteBuilderPageReviewUseCase.ts` with:

```ts
import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { GetWebsiteBuilderPageReviewUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private listAssignments: ListReviewAssignmentsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.id,
            action: "view this review"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }
        const { review, viewer } = authorized.value;

        const assignments = await this.listAssignments.execute({ reviewId: review.id });
        if (assignments.isFail()) {
            return Result.fail(assignments.error);
        }

        // The guard has proven read access to the target, so the viewer flags apply as they are.
        const visible = redactAssignmentRecords(assignments.value, viewer.permissions);
        return Result.ok({
            review: attachAssignmentRecords(review, visible),
            flags: getReviewViewerFlags(review, viewer)
        });
    }
}

export const GetWebsiteBuilderPageReviewUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageReviewUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ListReviewAssignmentsUseCase]
});
```

- [ ] **Step 7: The request title**

In `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/abstractions.ts`, in `RequestWebsiteBuilderPageReviewInput`, after `targetRevisionId: string;` add:

```ts
    /**
     * The review title (D135). Trimmed by the engine; at least 5 characters when given (D100,
     * R89); missing or empty means the page title.
     */
    title?: string | null;
```

In `packages/api-website-builder-workflows/src/features/wrappers/RequestWebsiteBuilderPageReview/RequestWebsiteBuilderPageReviewUseCase.ts`, replace the final engine call:

```ts
        return this.requestReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            picks: input.picks,
            actor: actor.value
        });
```

with:

```ts
        return this.requestReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: input.title,
            picks: input.picks,
            actor: actor.value
        });
```

- [ ] **Step 8: Register the new wrappers**

In `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`, add after the `GetWebsiteBuilderPageReviewFeature` import:

```ts
import { GetWebsiteBuilderPageTargetReviewFeature } from "./GetWebsiteBuilderPageTargetReview/feature.js";
import { ListWebsiteBuilderPageReviewsFeature } from "./ListWebsiteBuilderPageReviews/feature.js";
```

and in `register`, after `GetWebsiteBuilderPageReviewFeature.register(container);`, add:

```ts
        GetWebsiteBuilderPageTargetReviewFeature.register(container);
        ListWebsiteBuilderPageReviewsFeature.register(container);
```

- [ ] **Step 9: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (all files, including the existing `requestAndGetReview.test.ts`, whose get-review assertions read `review.id` and `flags`, unchanged).

Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS. If OpenSearch cannot run locally, record "not run" (A9).

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -20`
Expected: PASS (the CMS package's hooks run in this package's handler; nothing there changes).

- [ ] **Step 10: Type-check**

Run: `yarn check:test:types 2>&1 | grep -iE "api-website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 11: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-website-builder-workflows): add page review lists, target review, request title and assignment entries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
