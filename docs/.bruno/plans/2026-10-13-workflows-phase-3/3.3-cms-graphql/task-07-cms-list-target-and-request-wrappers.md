### Task 7: CMS review list, target review, request title, assignment entries

Spec 5.3, 8, 10, 11; D47, D76, D89, D94, D112, D127, D133, D135; R46, R47, R87, R89, R91, R92, R94, R95, R96, R106, R108; A41, A43, A44. Two new wrappers and two changed ones in `packages/api-headless-cms-workflows`, using Task 4's pure `attachAssignmentRecords`:

- `ListCmsEntryReviewsUseCase` (R94, R95): viewer, `failedSteps` refused without `reassign` before the engine, the bindable models the viewer can read (`ListModelsUseCase` + `isBindableModel`, optionally narrowed by `where.modelId`), then the engine's `ListReviewsUseCase` with an inline `canRead` arrow (`CmsEntryTargetReader.read` + `entryId` match + `CmsEntryAccess.canRead`), and viewer flags per row (`getReviewViewerFlags`, A43). No bindable readable model: an empty page without an engine call.
- `GetCmsEntryTargetReviewUseCase`: the active review of one revision, or `null`. Input `{ model, targetRevisionId }` (the namespace, as the engine's `GetTargetReviewInput` and every other CMS wrapper input take it; the GraphQL resolver maps `modelId` with the pure `toCmsNamespace`, R88). Access (R108): a namespace of another app is `Workflows/Review/TargetNotFound`; a revision that does not exist, is trashed or that the viewer cannot read (model or folder) is `Workflows/NotAuthorized` with `"view this review"` (does not reveal existence); a throw is `Workflows/Review/Persistence` (R87). Then the engine's `GetTargetReviewUseCase`.
- `RequestCmsEntryReviewUseCase` passes the optional `title` through (R89; the engine trims and validates it).
- `GetCmsEntryReviewUseCase` and `GetCmsEntryTargetReviewUseCase` read the assignment log (`ListReviewAssignmentsUseCase`), drop skip records for viewers without `editor` / `reassign` (`redactAssignmentRecords`) and attach the records to their steps (`attachAssignmentRecords`, Task 4). A failed log read fails the get with `Workflows/Assignment/Persistence` (R96, R87).

Every refusal before the engine is pinned with `engineCalls` (`CountingEngineCalls`, extended here with `ListReviews`, `GetTargetReview` and `ListReviewAssignments`). Folder access comes from `FakeFolderLevelPermissions` (A28); assignment records are seeded with `AssignmentRepository.create` (A44); failed steps are seeded with `ReviewRepository.save` (R93).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/utils/isBindableModel.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/ListCmsEntryReviewsUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/index.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/GetCmsEntryTargetReviewUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/abstractions.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/RequestCmsEntryReviewUseCase.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/abstractions.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/GetCmsEntryReviewUseCase.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/ThrowingListModels.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/FailingListReviewAssignments.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/listReviews.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`

**Interfaces:**
- Consumes:
  - 3.1 Task 1: `ReviewData.currentStepType: string | null`.
  - 3.1 Task 2: `RequestReviewUseCase` input `title?: string | null` (R89; message "The review title must have at least 5 characters.").
  - 3.1 Task 3: `ListReviewsUseCase` (`@webiny/api-workflows/features/review/ListReviews/index.js`), `execute(input: ListReviewsUseCase.Input): ListReviewsUseCase.Return`, `Input { list: ReviewListKind; viewerUserId: string; viewerTeamIds: string[]; models: string[]; where?: ReviewListWhere | null; sort?: ReviewListSort | null; limit?: number | null; after?: string | null; canRead: ReviewReadPredicate }`, value `{ items: ReviewData[]; meta: ReviewListMeta }`, `ListReviewsUseCase.Error` (`Workflows/Review/Validation`, `Workflows/Review/Persistence`). Types (`@webiny/api-workflows/domain/review/types.js`): `ReviewListKind = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "failedSteps"`, `ReviewListSort = "lastChangedOn_ASC" | "lastChangedOn_DESC"`, `ReviewListWhere { titleContains?: string | null; reviewState?: ReviewState | null; stepState?: StepState | null }`, `ReviewListMeta { cursor: string | null; hasMoreItems: boolean }`.
  - 3.1 Task 4: `AssignmentRecordValues.kind` / `AssignmentRecord.kind: "outcome" | "skip"` (`@webiny/api-workflows/domain/assignment/types.js`); `ListReviewAssignmentsUseCase` (`@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js`), `execute(input: { reviewId: string }): Promise<Result<AssignmentRecord[], AssignmentPersistenceError>>` with namespace `Input`, `Error`, `Return`; `redactAssignmentRecords(records: AssignmentRecord[], permissions: WorkflowsPermissionSet): AssignmentRecord[]` (`@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js`); `ReviewStepWithAssignments`, `ReviewWithAssignments`, `ReviewWithAssignmentsAndViewerFlags` (`@webiny/api-workflows/domain/assignment/types.js`) and the pure `attachAssignmentRecords(review: ReviewData, records: AssignmentRecord[]): ReviewWithAssignments` (`@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js`) (R106).
  - Phase 2: `CurrentReviewViewer`, `GetTargetReviewUseCase`, `getReviewViewerFlags`, `canReassignByPermission`, `CmsEntryTargetReader`, `CmsEntryAccess`, `CmsEntryReviewGuardService`, `isCmsNamespace`, `toCmsNamespace`, `ReviewRepository`, `AssignmentRepository`; `ListModelsUseCase` (`@webiny/api-headless-cms/features/contentModel/ListModels/index.js`), `execute(params?: { includePrivate?: boolean; includePlugins?: boolean }): Promise<Result<CmsModel[], ListModelsUseCase.Error>>` (fails with `Cms/Model/NotAuthorized` when the identity can read no model).
- Produces:
  - `isBindableModel(model: Pick<CmsModel, "isPrivate" | "tags">): boolean` and `UNPUBLISHABLE_MODEL_TAG = "$publishing:false"` (`~/utils/isBindableModel.js`, Task 8 reuses them).
  - `ListCmsEntryReviewsUseCase.Interface.execute(input: ListCmsEntryReviewsInput): Promise<Result<ListCmsEntryReviewsResult, ListCmsEntryReviewsUseCase.Error>>`; `ListCmsEntryReviewsWhere extends ReviewListWhere { modelId?: string | null }`; `ListCmsEntryReviewsInput { list: ReviewListKind; where?: ListCmsEntryReviewsWhere | null; sort?: ReviewListSort | null; limit?: number | null; after?: string | null }`; `ListCmsEntryReviewsResult { items: ReviewWithViewerFlags[]; meta: ReviewListMeta }`. Refusal action: `"list failed steps"` (R95).
  - `GetCmsEntryTargetReviewUseCase.Interface.execute(input: GetCmsEntryTargetReviewInput): Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, GetCmsEntryTargetReviewUseCase.Error>>`; `GetCmsEntryTargetReviewInput { model: string; targetRevisionId: string }`. Refusal action: `"view this review"`.
  - Changed: `RequestCmsEntryReviewInput.title?: string | null`; `GetCmsEntryReviewUseCase` returns `ReviewWithAssignmentsAndViewerFlags`, error adds `ListReviewAssignmentsUseCase.Error`.
  - Test helpers: `engineCalls` names `"ListReviews"`, `"GetTargetReview"`, `"ListReviewAssignments"`; `throwOnListModels`; `failListReviewAssignments`; `seedFailedStep`, `seedAssignmentRecords`, `SKIP_RECORD_REASON`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/ThrowingListModels.ts`:

```ts
import type { Container } from "@webiny/di";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";

class ThrowingListModels implements ListModelsUseCase.Interface {
    public constructor(private decoratee: ListModelsUseCase.Interface) {}

    public async execute(): ListModelsUseCase.Return {
        throw new Error("The model cache is down.");
    }
}

/** Every model list throws, as a failed model cache load does (`legacyPlugins`). */
export const throwOnListModels = (container: Container) => {
    container.registerDecorator(
        ListModelsUseCase.createDecorator({ decorator: ThrowingListModels, dependencies: [] })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/FailingListReviewAssignments.ts`:

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

/** Every assignment-log read fails (`legacyPlugins`). */
export const failListReviewAssignments = (container: Container) => {
    container.registerDecorator(
        ListReviewAssignmentsUseCase.createDecorator({
            decorator: FailingListReviewAssignments,
            dependencies: []
        })
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`:

```ts
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "@webiny/api-workflows/domain/assignment/abstractions/AssignmentRepository.js";
import { expectOk } from "./entries.js";
import { STEP_ID } from "./engine.js";
import { REQUESTER } from "./identities.js";

export const SKIP_RECORD_REASON = "The requester cannot review their own content.";

/**
 * Stores the review with its only step failed as an AI step, straight through the repository
 * (nothing produces `failed` before phase 5, R93).
 */
export const seedFailedStep = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    const failed: ReviewData = {
        ...review,
        currentStepState: "failed",
        currentStepType: "ai",
        steps: review.steps.map((step): ReviewStep => {
            return { ...step, type: "ai", state: "failed" };
        })
    };
    return expectOk(await context.container.resolve(ReviewRepository).save(failed));
};

/**
 * Two assignment records of the only step (A44): an outcome (the pool) and, a minute later, a
 * skip of the requester. Newest first, the skip comes first.
 */
export const seedAssignmentRecords = async (
    context: CmsContext,
    review: ReviewData
): Promise<void> => {
    const repository = context.container.resolve(AssignmentRepository);
    expectOk(
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
    expectOk(
        await repository.create({
            reviewId: review.id,
            workflowId: review.workflowId,
            stepId: STEP_ID,
            userId: REQUESTER.id,
            assignedOn: "2026-10-13T10:01:00.000Z",
            source: "strategy",
            by: null,
            reason: SKIP_RECORD_REASON,
            kind: "skip"
        })
    );
};
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/CountingEngineCalls.ts`, add the imports after the `GetReviewUseCase` import:

```ts
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
```

add the three classes after `CountingGetReview`:

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

and register them at the end of `countEngineCalls`, after the `CancelReviewUseCase` decorator:

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

Create `packages/api-headless-cms-workflows/__tests__/wrappers/listReviews.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, startEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import {
    NOBODY,
    OTHER_REVIEWER,
    REASSIGNER,
    REQUESTER,
    REVIEWER
} from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { throwOnListModels } from "~tests/__helpers/ThrowingListModels.js";
import { seedFailedStep } from "~tests/__helpers/seeds.js";
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";

/**
 * Admin stores the workflow; REQUESTER asks for a review of "Ann" (root folder) and of "Locked"
 * ("folder-locked"). Both first steps wait in the pool of the reviewers' team.
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, lockedEntry, review, lockedReview };
};

/**
 * A context that counts the engine's calls and can throw on target reads and access checks; setup
 * contexts do not.
 */
const createCountingContext = (params: UserContextParams) => {
    return createUserContext({
        ...params,
        legacyPlugins: [
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

const list = (context: CmsContext, input: ListCmsEntryReviewsUseCase.Input) => {
    return context.container.resolve(ListCmsEntryReviewsUseCase).execute(input);
};

describe("CMS review list wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("lists the pool with the viewer's flags per row (A43)", async () => {
        const { review, lockedReview } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const page = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(page.items[0].flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("does not list a review of an entry in a folder the viewer cannot read", async () => {
        const { review } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const page = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(page.items.map(item => item.review.title)).toEqual(["Ann"]);
    });

    it("lists the reviews assigned to me and the team's reviews in review", async () => {
        const { admin, review } = await createScenario();
        await startEntryReview(admin, review, REVIEWER);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const otherReviewer = await createUserContext({
            identity: OTHER_REVIEWER,
            permissions: CMS_READER
        });

        const assigned = expectOk(await list(reviewer, { list: "assignedToMe" }));
        const teamInReview = expectOk(await list(otherReviewer, { list: "teamInReview" }));
        const ownTeamInReview = expectOk(await list(reviewer, { list: "teamInReview" }));

        expect(assigned.items.map(item => item.review.id)).toEqual([review.id]);
        expect(assigned.items[0].flags.canApprove).toBe(true);
        expect(teamInReview.items.map(item => item.review.id)).toEqual([review.id]);
        expect(teamInReview.items[0].flags.canApprove).toBe(false);
        expect(ownTeamInReview.items).toEqual([]);
    });

    it("lists only the requests of the viewer", async () => {
        const { admin, review, lockedReview } = await createScenario();
        const otherEntry = await createAuthorEntry(admin, { name: "Other" });
        await requestEntryReview(admin, otherEntry, OTHER_REVIEWER);
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const page = expectOk(await list(requester, { list: "myRequests" }));

        expect(page.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(page.items.every(item => item.flags.canCancel)).toBe(true);
    });

    it("does not list the reviews of another app (R46)", async () => {
        const { review, lockedReview } = await createScenario();
        await createWbReview();
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const page = expectOk(await list(requester, { list: "myRequests" }));

        expect(page.items.map(item => item.review.model)).toEqual(["cms.author", "cms.author"]);
        expect(page.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
    });

    it("lists only the given model and returns an empty page for a model it cannot list (R94)", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const author = expectOk(
            await list(requester, { list: "myRequests", where: { modelId: "author" } })
        );
        engineCalls.length = 0;
        const unknown = expectOk(
            await list(requester, { list: "myRequests", where: { modelId: "book" } })
        );

        expect(author.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(unknown).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("filters by title", async () => {
        const { lockedReview } = await createScenario();
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const page = expectOk(
            await list(requester, { list: "myRequests", where: { titleContains: "Lock" } })
        );

        expect(page.items.map(item => item.review.id)).toEqual([lockedReview.id]);
    });

    it("refuses the failed steps list without reassign", async () => {
        await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const result = await list(reviewer, { list: "failedSteps" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list failed steps" });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("lists failed AI and automation steps for a viewer with reassign (D112)", async () => {
        const { admin, review } = await createScenario();
        await seedFailedStep(admin, review);
        const reassigner = await createUserContext({
            identity: REASSIGNER,
            permissions: [...CMS_READER, WORKFLOWS_REASSIGN]
        });

        const page = expectOk(await list(reassigner, { list: "failedSteps" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(page.items[0].review.currentStepType).toBe("ai");
    });

    it("pages with the cursor without losing or repeating a review", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const first = expectOk(await list(requester, { list: "myRequests", limit: 1 }));
        const second = expectOk(
            await list(requester, { list: "myRequests", limit: 1, after: first.meta.cursor })
        );

        expect(first.items).toHaveLength(1);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(first.meta.cursor).toEqual(expect.any(String));
        expect(second.items).toHaveLength(1);
        expect([...first.items, ...second.items].map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
    });

    it("returns an empty page for a viewer who can read no model, before the engine", async () => {
        await createScenario();
        const nobody = await createCountingContext({ identity: NOBODY, permissions: [] });

        const page = expectOk(await list(nobody, { list: "pool" }));

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("refuses an anonymous identity, before the engine", async () => {
        await createScenario();
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const result = await list(anonymous, { list: "pool" });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("counts a target read or read check that throws as unreadable (R92)", async () => {
        const { review, lockedEntry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });
        throwingTargetRevisions.add(lockedEntry.id);

        const page = expectOk(await list(reviewer, { list: "pool" }));
        throwingAccessChecks.add("canRead");
        const nothingReadable = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(nothingReadable.items).toEqual([]);
    });

    it("fails with a persistence error when the model list throws (R87)", async () => {
        await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [throwOnListModels]
        });

        const result = await list(reviewer, { list: "pool" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListReviews");
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import {
    AUTHOR_NAMESPACE,
    createAuthorEntry,
    expectOk,
    getAuthorModel
} from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { EDITOR, NOBODY, REASSIGNER, REVIEWER } from "~tests/__helpers/identities.js";
import {
    CMS_READER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { failListReviewAssignments } from "~tests/__helpers/FailingListReviewAssignments.js";
import { SKIP_RECORD_REASON, seedAssignmentRecords } from "~tests/__helpers/seeds.js";
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";

/**
 * Admin stores the workflow, creates "Ann" (reviewed), "Bob" (no review) and "Locked" (reviewed,
 * in "folder-locked").
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const unreviewedEntry = await createAuthorEntry(admin, { name: "Bob" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, unreviewedEntry, lockedEntry, review, lockedReview };
};

const createCountingContext = (params: UserContextParams) => {
    return createUserContext({
        ...params,
        legacyPlugins: [
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

const getTargetReview = (context: CmsContext, entry: CmsEntry, model = AUTHOR_NAMESPACE) => {
    return context.container
        .resolve(GetCmsEntryTargetReviewUseCase)
        .execute({ model, targetRevisionId: entry.id });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetCmsEntryReviewUseCase).execute({ id });
};

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

describe("CMS target review wrapper and assignment entries", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("returns the active review of a revision with the viewer's flags", async () => {
        const { entry, review } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const result = expectOk(await getTargetReview(reviewer, entry));

        expect(result?.review.id).toBe(review.id);
        expect(result?.flags).toMatchObject({ canStart: true, canCancel: false });
        expect(result?.review.steps.map(step => [step.id, step.assignments])).toEqual([
            [STEP_ID, []]
        ]);
    });

    it("returns null for a revision without a review", async () => {
        const { unreviewedEntry } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const result = await getTargetReview(reviewer, unreviewedEntry);

        expect(result.isOk()).toBe(true);
        expect(result.value).toBeNull();
    });

    it("refuses a revision in a folder the viewer cannot read, before the engine", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const result = await getTargetReview(reviewer, lockedEntry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "view this review" });
        expect(engineCalls).toEqual([]);
    });

    it("refuses a revision the viewer cannot read, that does not exist or is trashed, before the engine (R108)", async () => {
        const { admin, entry, unreviewedEntry } = await createScenario();
        expectOk(await trash(admin, unreviewedEntry));
        const nobody = await createCountingContext({ identity: NOBODY, permissions: [] });
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const hidden = await getTargetReview(nobody, entry);
        const missing = await reviewer.container
            .resolve(GetCmsEntryTargetReviewUseCase)
            .execute({ model: AUTHOR_NAMESPACE, targetRevisionId: "missing#0001" });
        const trashed = await getTargetReview(reviewer, unreviewedEntry);

        for (const result of [hidden, missing, trashed]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "view this review" });
        }
        expect(engineCalls).toEqual([]);
    });

    it("reports another app's namespace as not found (R46, R108)", async () => {
        const { entry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const otherApp = await getTargetReview(reviewer, entry, "wb.page");

        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(otherApp.error.data).toEqual({ model: "wb.page", targetRevisionId: entry.id });
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity, before the engine", async () => {
        const { entry } = await createScenario();
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const result = await getTargetReview(anonymous, entry);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the target read or the read check throws (R87)", async () => {
        const { entry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        throwingTargetRevisions.add(entry.id);
        const readThrows = await getTargetReview(reviewer, entry);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canRead");
        const checkThrows = await getTargetReview(reviewer, entry);

        expect(readThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(checkThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("drops skip entries from the review read for a plain reviewer", async () => {
        const { admin, entry, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const byId = expectOk(await getReview(reviewer, review.id));
        const byRevision = expectOk(await getTargetReview(reviewer, entry));

        expect(byId.review.steps[0].assignments.map(record => record.kind)).toEqual(["outcome"]);
        expect(byRevision?.review.steps[0].assignments.map(record => record.kind)).toEqual([
            "outcome"
        ]);
        expect(byId.review.steps[0].assignments[0]).toMatchObject({
            reviewId: review.id,
            stepId: STEP_ID,
            userId: null,
            source: "pool"
        });
    });

    it("keeps skip entries for editor and reassign and drops them for everyone else", async () => {
        const { admin, entry, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...CMS_READER]
        });
        const reassigner = await createUserContext({
            identity: REASSIGNER,
            permissions: [WORKFLOWS_REASSIGN, ...CMS_READER]
        });

        const asEditor = expectOk(await getReview(editor, review.id));
        const asReassigner = expectOk(await getTargetReview(reassigner, entry));

        expect(asEditor.review.steps[0].assignments.map(record => record.kind)).toEqual([
            "skip",
            "outcome"
        ]);
        expect(asEditor.review.steps[0].assignments[0].reason).toBe(SKIP_RECORD_REASON);
        expect(asReassigner?.review.steps[0].assignments.map(record => record.kind)).toEqual([
            "skip",
            "outcome"
        ]);
    });

    it("fails the review read when the assignment log cannot be read (R96, R87)", async () => {
        const { entry, review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [failListReviewAssignments]
        });

        const byId = await getReview(reviewer, review.id);
        const byRevision = await getTargetReview(reviewer, entry);

        expect(byId.error.code).toBe("Workflows/Assignment/Persistence");
        expect(byRevision.error.code).toBe("Workflows/Assignment/Persistence");
    });
});
```

In `packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts`, add after the `request` helper:

```ts
const requestWithTitle = (context: CmsContext, entry: CmsEntry, title: string) => {
    return context.container.resolve(RequestCmsEntryReviewUseCase).execute({
        model: AUTHOR_NAMESPACE,
        targetId: entry.entryId,
        targetRevisionId: entry.id,
        title
    });
};
```

and add these tests at the end of the `describe` block:

```ts
    it("requests a review with the given title (R89)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const review = expectOk(await requestWithTitle(requester, entry, "  Spring launch  "));

        expect(review.title).toBe("Spring launch");
    });

    it("rejects a title shorter than 5 characters (R89)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await requestWithTitle(requester, entry, " abc ");

        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
    });

    it("uses the entry title when the title is empty (R89)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const review = expectOk(await requestWithTitle(requester, entry, "   "));

        expect(review.title).toBe("Ann");
    });
```

In `packages/api-headless-cms-workflows/__tests__/registration.test.ts`, add the imports after the `GetCmsEntryReviewUseCase` import:

```ts
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";
```

and add `GetCmsEntryTargetReviewUseCase,` and `ListCmsEntryReviewsUseCase,` to `WRAPPERS` after `GetCmsEntryReviewUseCase,`.

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/ListCmsEntryReviews/index.js` and `~/features/wrappers/GetCmsEntryTargetReview/index.js`; the first two title tests fail (the wrapper drops `title`, so the review keeps "Ann" and no validation error is returned); "uses the entry title when the title is empty" passes already.

- [ ] **Step 3: The bindable model rule**

Create `packages/api-headless-cms-workflows/src/utils/isBindableModel.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

/** Models with this tag cannot be published, so they cannot be bound (spec 4.1, D41). */
export const UNPUBLISHABLE_MODEL_TAG = "$publishing:false";

/**
 * A model a workflow can be bound to: public and publishable (the rule
 * `DisallowUnpublishableModelsOnBeforeCreate` enforces). Readability comes from
 * `ListModelsUseCase`, which returns only models the identity can read. Pure.
 */
export const isBindableModel = (model: Pick<CmsModel, "isPrivate" | "tags">): boolean => {
    if (model.isPrivate) {
        return false;
    }
    return !(model.tags ?? []).includes(UNPUBLISHABLE_MODEL_TAG);
};
```

- [ ] **Step 4: ListCmsEntryReviews**

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/abstractions.ts`:

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
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import type { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";

export interface ListCmsEntryReviewsWhere extends ReviewListWhere {
    /** Only the reviews of this model (the model id, without `cms.`, R94). */
    modelId?: string | null;
}

export interface ListCmsEntryReviewsInput {
    list: ReviewListKind;
    where?: ListCmsEntryReviewsWhere | null;
    /** Default per list (D119). */
    sort?: ReviewListSort | null;
    /** Default 20, max 100 (R92). */
    limit?: number | null;
    /** `meta.cursor` of the previous page. */
    after?: string | null;
}

export interface ListCmsEntryReviewsResult {
    items: ReviewWithViewerFlags[];
    meta: ReviewListMeta;
}

export interface IListCmsEntryReviewsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: ReviewPersistenceError;
    list: ListReviewsUseCase.Error;
}

type UseCaseError = IListCmsEntryReviewsUseCaseErrors[keyof IListCmsEntryReviewsUseCaseErrors];

export interface IListCmsEntryReviewsUseCase {
    execute(input: ListCmsEntryReviewsInput): Promise<Result<ListCmsEntryReviewsResult, UseCaseError>>;
}

/**
 * One page of a review list of the Headless CMS (spec 11, R94): only reviews of bindable models the
 * viewer can read, and only rows whose entry the viewer can read (D76, D133). Failed steps need
 * `reassign` (D112, R95). Each row carries the viewer's flags (A43).
 */
export const ListCmsEntryReviewsUseCase = createAbstraction<IListCmsEntryReviewsUseCase>(
    "ListCmsEntryReviewsUseCase"
);

export namespace ListCmsEntryReviewsUseCase {
    export type Interface = IListCmsEntryReviewsUseCase;
    export type Input = ListCmsEntryReviewsInput;
    export type Where = ListCmsEntryReviewsWhere;
    export type Value = ListCmsEntryReviewsResult;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListCmsEntryReviewsResult, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/ListCmsEntryReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { ListCmsEntryReviewsUseCase as UseCase } from "./abstractions.js";

/** `ListModelsUseCase` fails with this when the identity can read no model at all. */
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";

class ListCmsEntryReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listModels: ListModelsUseCase.Interface,
        private listReviews: ListReviewsUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }
        if (input.list === "failedSteps" && !canReassignByPermission(viewer.value)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list failed steps" }));
        }

        // The models the viewer can read (R94); a viewer who can read none gets an empty page.
        let models: Awaited<ListModelsUseCase.Return>;
        try {
            models = await this.listModels.execute({ includePrivate: false, includePlugins: true });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (models.isFail() && models.error.code !== MODEL_NOT_AUTHORIZED) {
            return Result.fail(new ReviewPersistenceError(models.error));
        }
        const where: UseCase.Where = input.where ?? {};
        const { modelId, ...listWhere } = where;
        const namespaces = (models.isOk() ? models.value : [])
            .filter(model => isBindableModel(model))
            .filter(model => !modelId || model.modelId === modelId)
            .map(model => toCmsNamespace(model.modelId));
        if (namespaces.length === 0) {
            return Result.ok({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }

        const page = await this.listReviews.execute({
            list: input.list,
            viewerUserId: viewer.value.actor.id,
            viewerTeamIds: viewer.value.teamIds,
            models: namespaces,
            where: listWhere,
            sort: input.sort ?? undefined,
            limit: input.limit ?? undefined,
            after: input.after ?? null,
            // The CMS's own read logic on the review's revision (R47, R94). A throw counts as
            // unreadable in the engine (R92).
            canRead: async (review: ReviewData): Promise<boolean> => {
                const target = await this.targets.read({
                    model: review.model,
                    targetRevisionId: review.targetRevisionId
                });
                if (!target || target.entry.entryId !== review.targetId) {
                    return false;
                }
                return this.access.canRead(target);
            }
        });
        if (page.isFail()) {
            return Result.fail(page.error);
        }

        // A listed row is readable by construction; the flags need no target access (A43).
        return Result.ok({
            items: page.value.items.map(review => {
                return { review, flags: getReviewViewerFlags(review, viewer.value) };
            }),
            meta: page.value.meta
        });
    }
}

export const ListCmsEntryReviewsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryReviewsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        ListModelsUseCase,
        ListReviewsUseCase,
        CmsEntryTargetReader,
        CmsEntryAccess
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryReviewsUseCase } from "./ListCmsEntryReviewsUseCase.js";

export const ListCmsEntryReviewsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryReviews",
    register(container) {
        container.register(ListCmsEntryReviewsUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryReviews/index.ts`:

```ts
export { ListCmsEntryReviewsUseCase } from "./abstractions.js";
export type {
    ListCmsEntryReviewsInput,
    ListCmsEntryReviewsResult,
    ListCmsEntryReviewsWhere
} from "./abstractions.js";
```

- [ ] **Step 5: GetCmsEntryTargetReview**

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";

export interface GetCmsEntryTargetReviewInput {
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    targetRevisionId: string;
}

export interface IGetCmsEntryTargetReviewUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    get: GetTargetReviewUseCase.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError =
    IGetCmsEntryTargetReviewUseCaseErrors[keyof IGetCmsEntryTargetReviewUseCaseErrors];

export interface IGetCmsEntryTargetReviewUseCase {
    execute(
        input: GetCmsEntryTargetReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}

/**
 * The active review of a CMS entry revision with the viewer's flags and redacted assignment
 * entries, or `null` (spec 10, R96). Needs read access to the revision: a missing, trashed or
 * unreadable revision is `NotAuthorized` (R108); a namespace of another app is not found (R46).
 */
export const GetCmsEntryTargetReviewUseCase = createAbstraction<IGetCmsEntryTargetReviewUseCase>(
    "GetCmsEntryTargetReviewUseCase"
);

export namespace GetCmsEntryTargetReviewUseCase {
    export type Interface = IGetCmsEntryTargetReviewUseCase;
    export type Input = GetCmsEntryTargetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags | null, UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/GetCmsEntryTargetReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { GetCmsEntryTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryTargetReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface,
        private listAssignments: ListReviewAssignmentsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const viewer = await this.viewer.get();
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        // Another app's namespace is not found (R46, R108).
        if (!isCmsNamespace(input.model)) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        // A missing, trashed or unreadable revision is refused alike, so the answer does not
        // reveal whether it exists (R108); a failed read or access check is a persistence error
        // (R87).
        let canRead: boolean;
        try {
            const target = await this.targets.read({
                model: input.model,
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
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (!review.value) {
            return Result.ok(null);
        }

        const records = await this.listAssignments.execute({ reviewId: review.value.id });
        if (records.isFail()) {
            return Result.fail(records.error);
        }
        const visible = redactAssignmentRecords(records.value, viewer.value.permissions);
        return Result.ok({
            review: attachAssignmentRecords(review.value, visible),
            flags: getReviewViewerFlags(review.value, viewer.value)
        });
    }
}

export const GetCmsEntryTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryTargetReviewUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        CmsEntryTargetReader,
        CmsEntryAccess,
        GetTargetReviewUseCase,
        ListReviewAssignmentsUseCase
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryTargetReviewUseCase } from "./GetCmsEntryTargetReviewUseCase.js";

export const GetCmsEntryTargetReviewFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryTargetReview",
    register(container) {
        container.register(GetCmsEntryTargetReviewUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryTargetReview/index.ts`:

```ts
export { GetCmsEntryTargetReviewUseCase } from "./abstractions.js";
export type { GetCmsEntryTargetReviewInput } from "./abstractions.js";
```

- [ ] **Step 6: Request title and assignment entries in the existing wrappers**

In `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/abstractions.ts`, add to `RequestCmsEntryReviewInput` after `targetRevisionId`:

```ts
    /**
     * The review title (D135); trimmed and at least 5 characters, checked by the engine (R89).
     * Missing or empty: the entry's title.
     */
    title?: string | null;
```

In `packages/api-headless-cms-workflows/src/features/wrappers/RequestCmsEntryReview/RequestCmsEntryReviewUseCase.ts`, replace the final engine call with:

```ts
        return this.requestReview.execute({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: input.title,
            picks: input.picks,
            actor: actor.value
        });
```

Replace `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/abstractions.ts` with:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewWithAssignmentsAndViewerFlags } from "@webiny/api-workflows/domain/assignment/types.js";
import type { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface GetCmsEntryReviewInput {
    id: string;
}

export interface IGetCmsEntryReviewUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    assignments: ListReviewAssignmentsUseCase.Error;
}

type UseCaseError = IGetCmsEntryReviewUseCaseErrors[keyof IGetCmsEntryReviewUseCaseErrors];

export interface IGetCmsEntryReviewUseCase {
    execute(
        input: GetCmsEntryReviewInput
    ): Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}

/**
 * A CMS review with the reading user's flags (spec 5.3, R62) and the assignment-log entries of
 * each step (D127); needs read access to the target. Skip entries are dropped for viewers without
 * `editor` / `reassign` here, in the wrapper and not in the resolver (spec 8, D89, R96).
 */
export const GetCmsEntryReviewUseCase = createAbstraction<IGetCmsEntryReviewUseCase>(
    "GetCmsEntryReviewUseCase"
);

export namespace GetCmsEntryReviewUseCase {
    export type Interface = IGetCmsEntryReviewUseCase;
    export type Input = GetCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewWithAssignmentsAndViewerFlags, UseCaseError>>;
}
```

Replace `packages/api-headless-cms-workflows/src/features/wrappers/GetCmsEntryReview/GetCmsEntryReviewUseCase.ts` with:

```ts
import { Result } from "@webiny/feature/api";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { GetCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
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

        const records = await this.listAssignments.execute({ reviewId: review.id });
        if (records.isFail()) {
            return Result.fail(records.error);
        }
        const visible = redactAssignmentRecords(records.value, viewer.permissions);

        // The guard has proven read access to the target, so the viewer flags apply as they are.
        return Result.ok({
            review: attachAssignmentRecords(review, visible),
            flags: getReviewViewerFlags(review, viewer)
        });
    }
}

export const GetCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryReviewUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ListReviewAssignmentsUseCase]
});
```

- [ ] **Step 7: Register**

In `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`, add the imports after the `GetCmsEntryReviewFeature` import:

```ts
import { GetCmsEntryTargetReviewFeature } from "./GetCmsEntryTargetReview/feature.js";
import { ListCmsEntryReviewsFeature } from "./ListCmsEntryReviews/feature.js";
```

and register them in the `// Reviews` block after `GetCmsEntryReviewFeature.register(container);`:

```ts
        GetCmsEntryTargetReviewFeature.register(container);
        ListCmsEntryReviewsFeature.register(container);
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (all wrapper, hook and registration tests).

Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS, or "not run" (A9).

Run: `yarn check:test:types 2>&1 | grep -iE "api-headless-cms-workflows" | head`
Expected: no output.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-headless-cms-workflows): add the cms review list and target review wrappers with assignment entries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
