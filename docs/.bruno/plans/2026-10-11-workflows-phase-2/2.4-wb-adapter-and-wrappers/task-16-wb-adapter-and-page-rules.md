### Task 16: WB loader, sync, read access for another user, publish, move and delete rules

Spec 4.5, 5.1, 9.3, D59, D62, D79, D84, D121, R48, R52-R56, R63, R66, A26. The `wb.page` implementations of the engine ports and the WB page rules on the WB page events. The single CMS handlers (Task 9) already cover pages through `WbPageReviewNamespace` (Task 15); this task pins that with page tests.

- `WbPageReviewTargetLoader`, `WbPageReviewTargetSync`, `WbPageReviewTargetAccess`: as the CMS ones (Task 8), over `WbPageTargetReader` and `WbPageAccess`.
- `RequireApprovedReviewOnPagePublish` (`PageBeforePublish`), `BlockPageMoveWhileInReview` (`PageBeforeMove`; WB `MovePage` bypasses CMS `MoveEntryUseCase`), `DeleteReviewsOnPageDelete` (`PageAfterDelete`, the permanent delete of a trashed page).

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/target/toWbPageReviewTarget.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetLoader.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetSync.ts`
- Create: `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetAccess.ts`
- Modify: `packages/api-website-builder-workflows/src/features/target/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/RequireApprovedReviewOnPagePublish.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/BlockPageMoveWhileInReview.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/DeleteReviewsOnPageDelete.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/feature.ts`
- Modify: `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/__helpers/engine.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts`

**Interfaces:**
- Consumes: `WbPageTargetReader`, `WbPageAccess` (Task 15), `ReviewTargetLoader`, `ReviewTargetSync`, `ReviewTargetAccess`, `RunAsUser`, `ListWorkflowsUseCase`, `GetTargetReviewUseCase`, `ListTargetReviewsUseCase`, `DeleteTargetReviewsUseCase`, `ReviewPublishBlockedError`, `ReviewTargetLockedError` (2.1), `PageBeforePublishEventHandler`, `PageBeforeMoveEventHandler`, `PageAfterDeleteEventHandler` (`@webiny/api-website-builder/features/pages/{PublishPage,MovePage,DeletePage}/index.js`), `PageModelProvider`, `UpdateEntrySystemUseCase`, `IdentityContext`.
- Produces:
  - `toWbPageReviewTarget(target: WbPageTarget): ReviewTarget`.
  - Three port implementations (answer `wb.page` only) registered by `WbTargetFeature`; three handlers registered by `WbHooksFeature`.
  - Test helpers (`__tests__/__helpers/engine.ts`): `STEP_ID`, `WB_ADMIN_ACTOR`, `createWbWorkflowValues()`, `storeWbWorkflow(context)`, `requestPageReview(context, page, requester?)`, `startPageReview`, `approvePageReview`, `rejectPageReview`, `cancelPageReview`, `readPage(context, revisionId)`.

- [ ] **Step 1: Write the test helpers and the failing test**

Create `packages/api-website-builder-workflows/__tests__/__helpers/engine.ts`:

```ts
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import type { Actor, ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { Workflow, WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { expectOk, getPageModel } from "./pages.js";
import { REQUESTER, REVIEW_TEAM, REVIEWER, toActor } from "./identities.js";

export const STEP_ID = "step-1";

/** The default identity of `createCmsTestHandler`, as a workflow actor (R58). */
export const WB_ADMIN_ACTOR: Actor = {
    type: "user",
    id: "id-12345678",
    displayName: "John Doe",
    identityType: "admin"
};

export const createWbWorkflowValues = (): WorkflowValues => {
    return {
        id: "wb-workflow",
        name: "Pages review",
        models: ["wb.page"],
        steps: [
            {
                id: STEP_ID,
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                type: "review",
                notifications: [],
                config: {
                    teams: [REVIEW_TEAM],
                    assignment: { strategy: "none", allowManualPick: false, rules: [] }
                }
            }
        ]
    };
};

/** Stores the pages workflow through the engine (no wrapper). */
export const storeWbWorkflow = async (context: CmsContext): Promise<Workflow> => {
    return expectOk(
        await context.container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWbWorkflowValues(), actor: WB_ADMIN_ACTOR })
    );
};

export const requestPageReview = async (
    context: CmsContext,
    page: WbPage,
    requester: IdentityData = REQUESTER
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(RequestReviewUseCase).execute({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id,
            actor: toActor(requester)
        })
    );
};

export const startPageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(StartReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM]
        })
    );
};

export const approvePageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startPageReview(context, review);
    return expectOk(
        await context.container.resolve(ApproveReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM],
            comment: null
        })
    );
};

export const rejectPageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startPageReview(context, review);
    return expectOk(
        await context.container.resolve(RejectReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM],
            comment: "Needs another pass."
        })
    );
};

export const cancelPageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container
            .resolve(CancelReviewUseCase)
            .execute({ reviewId: review.id, actor: toActor(REQUESTER) })
    );
};

/** The stored page revision as a CMS entry, read without access checks. */
export const readPage = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const model = await getPageModel(context);
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(model, revisionId)
    );
};
```

Create `packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { PublishPageUseCase } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { UnpublishPageUseCase } from "@webiny/api-website-builder/features/pages/UnpublishPage/index.js";
import { MovePageUseCase } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { UpdatePageUseCase } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { DeletePageUseCase } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetAccess } from "@webiny/api-workflows/features/review/ReviewTargetAccess/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    cancelPageReview,
    readPage,
    rejectPageReview,
    requestPageReview,
    STEP_ID,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";
import { ADMIN, NOBODY, READER, WB_READER } from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";

const createAdminContext = () => {
    return createUserContext({
        permissionsByIdentity: { [READER.id]: WB_READER, [NOBODY.id]: [] }
    });
};

describe("WB page adapter", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("loads a page revision's title and typed context", async () => {
        const context = await createAdminContext();
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const loaders = context.container.resolveAll(ReviewTargetLoader);
        const loader = loaders.find(item => item.canLoad("wb.page"))!;

        const loaded = await loader.load({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id
        });

        expect(loaded).toEqual({
            title: "Page A",
            context: {
                folder: { id: "folder-1", type: "wb:page" },
                modelId: PAGE_MODEL_ID,
                title: "Page A",
                author: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        });
        // The CMS adapter does not claim pages (R52).
        expect(loaders.filter(item => item.canLoad("wb.page"))).toHaveLength(1);
    });

    it("writes system.workflow on request and clears it on cancel", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });

        const review = await requestPageReview(context, page);
        const requested = await readPage(context, page.id);
        await cancelPageReview(context, review);
        const cancelled = await readPage(context, page.id);

        expect(requested.system?.workflow).toEqual({
            workflowId: "wb-workflow",
            reviewState: "inProgress",
            stepId: STEP_ID,
            stepName: "Step 1",
            stepState: "awaiting"
        });
        expect(cancelled.system?.workflow).toBeNull();
    });

    it("answers read access for another user with that user's permissions (R48)", async () => {
        const context = await createAdminContext();
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const access = context.container
            .resolveAll(ReviewTargetAccess)
            .find(item => item.canAccess("wb.page"))!;
        const params = { model: "wb.page", targetId: page.entryId, targetRevisionId: page.id };

        const reader = await access.canUserRead({ ...params, userId: READER.id });
        const nobody = await access.canUserRead({ ...params, userId: NOBODY.id });
        folderLevels.set("folder-1", new Map([[READER.id, "no-access"]]));
        const readerWithoutFolder = await access.canUserRead({ ...params, userId: READER.id });

        expect(reader).toBe(true);
        expect(nobody).toBe(false);
        expect(readerWithoutFolder).toBe(false);
    });

    it("starts a new page revision without system.workflow (D59)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await approvePageReview(context, await requestPageReview(context, page));

        const revision = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        expect((await readPage(context, revision.id)).system?.workflow).toBeNull();
    });

    it("blocks updates to a page under review through the CMS save block (R51, R54)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const updatePage = context.container.resolve(UpdatePageUseCase);

        const blocked = await updatePage.execute(page.id, { properties: { title: "Changed" } });
        await cancelPageReview(context, review);
        const allowed = await updatePage.execute(page.id, { properties: { title: "Changed" } });

        expect(blocked.isFail()).toBe(true);
        // WB wraps CMS failures in its persistence error and keeps the message.
        expect(blocked.error.message).toBe(
            new ReviewTargetLockedError({
                reviewId: review.id,
                model: "wb.page",
                targetRevisionId: page.id,
                reviewState: "inProgress",
                action: "update"
            }).message
        );
        expect(allowed.isOk()).toBe(true);
    });

    it("publishes normally without a pages workflow", async () => {
        const context = await createAdminContext();
        const page = await createPage(context, { title: "Page A" });

        const published = await context.container
            .resolve(PublishPageUseCase)
            .execute({ id: page.id });

        expect(published.isOk()).toBe(true);
    });

    it("blocks publishing without an approved review (D79)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const withoutReview = await createPage(context, { title: "No review" });
        const rejected = await createPage(context, { title: "Rejected" });
        await rejectPageReview(context, await requestPageReview(context, rejected));
        const publishPage = context.container.resolve(PublishPageUseCase);

        // WB publishes the before event outside a try, so the handler's error rejects (A26).
        await expect(publishPage.execute({ id: withoutReview.id })).rejects.toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: { reviewState: null }
        });
        await expect(publishPage.execute({ id: rejected.id })).rejects.toMatchObject({
            code: "Workflows/Review/PublishBlocked",
            data: { reviewState: "rejected" }
        });
    });

    it("publishes an approved page and republishes it after unpublishing (D121)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await approvePageReview(context, await requestPageReview(context, page));
        const publishPage = context.container.resolve(PublishPageUseCase);

        const published = await publishPage.execute({ id: page.id });
        expectOk(await context.container.resolve(UnpublishPageUseCase).execute({ id: page.id }));
        const republished = await publishPage.execute({ id: page.id });

        expect(published.isOk()).toBe(true);
        expect(republished.isOk()).toBe(true);
    });

    it("blocks moving a page while its review is in progress (D84)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A", folderId: "folder-1" });
        const review = await requestPageReview(context, page);
        const movePage = context.container.resolve(MovePageUseCase);

        await expect(movePage.execute({ id: page.id, folderId: "folder-2" })).rejects.toMatchObject(
            { code: "Workflows/Review/TargetLocked", data: { action: "move" } }
        );
        await cancelPageReview(context, review);
        const moved = await movePage.execute({ id: page.id, folderId: "folder-2" });

        expect(moved.isOk()).toBe(true);
    });

    it("keeps reviews of a trashed page and deletes them with the page (R56)", async () => {
        const context = await createAdminContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const getReview = context.container.resolve(GetReviewUseCase);

        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));
        const afterTrash = await getReview.execute({ id: review.id });
        expectOk(await context.container.resolve(DeletePageUseCase).execute({ id: page.id }));
        const afterDelete = await getReview.execute({ id: review.id });

        expect(afterTrash.isOk()).toBe(true);
        expect(afterDelete.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageAdapter.test.ts 2>&1 | tail -50`
Expected: FAIL. No `ReviewTargetLoader` matches `wb.page` (`loader` is `undefined`); the request fails with `Workflows/Review/TargetNotFound`. The save-block and revision-null tests fail at the request for the same reason.

- [ ] **Step 3: Implement the ports**

Create `packages/api-website-builder-workflows/src/features/target/toWbPageReviewTarget.ts`:

```ts
import type { ReviewTarget } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ROOT_FOLDER, WB_PAGE_FOLDER_TYPE } from "~/constants.js";
import type { WbPageTarget } from "./WbPageTargetReader/abstractions.js";

/** Title and typed `TargetContext` of a page revision (spec 9.3, R66). Pure. */
export const toWbPageReviewTarget = (target: WbPageTarget): ReviewTarget => {
    const { model, page } = target;
    const title = page.properties.title;
    const folderId = page.location.folderId;
    return {
        title,
        context: {
            folder:
                folderId && folderId !== ROOT_FOLDER
                    ? { id: folderId, type: WB_PAGE_FOLDER_TYPE }
                    : null,
            modelId: model.modelId,
            title,
            author: { id: page.createdBy.id, displayName: page.createdBy.displayName }
        }
    };
};
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetLoader.ts`:

```ts
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { toWbPageReviewTarget } from "./toWbPageReviewTarget.js";

/** Loads `wb.page` targets for `RequestReviewUseCase` (spec 9.3). */
class WbPageReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    public constructor(private targets: WbPageTargetReader.Interface) {}

    public canLoad(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async load(
        params: ReviewTargetLoader.LoadParams
    ): Promise<ReviewTargetLoader.Target | null> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.page.entryId !== params.targetId) {
            return null;
        }
        return toWbPageReviewTarget(target);
    }
}

export const WbPageReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: WbPageReviewTargetLoaderImpl,
    dependencies: [WbPageTargetReader]
});
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetSync.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Writes `system.workflow` on the page revision (spec 4.5, D52, R63). The page model is read as the
 * current identity (A19); only the system write runs without authorization, so a reviewer with
 * read access can move the review on. Pages are CMS entries, so this is the same
 * `UpdateEntrySystemUseCase` the CMS adapter uses; it does not publish `EntryBeforeUpdate` (D62).
 */
class WbPageReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private pageModelProvider: PageModelProvider.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface
    ) {}

    public canSync(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        const model = await this.pageModelProvider.get();
        const updated = await this.identityContext.withoutAuthorization(() => {
            return this.updateEntrySystem.execute(model, params.review.targetRevisionId, {
                workflow: params.systemWorkflow
            });
        });
        if (updated.isFail()) {
            return Result.fail(updated.error);
        }
        return Result.ok();
    }
}

export const WbPageReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: WbPageReviewTargetSyncImpl,
    dependencies: [IdentityContext, PageModelProvider, UpdateEntrySystemUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetAccess.ts`:

```ts
import { ReviewTargetAccess } from "@webiny/api-workflows/features/review/ReviewTargetAccess/index.js";
import { RunAsUser } from "@webiny/api-workflows/features/identity/RunAsUser/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { WbPageAccess } from "./WbPageAccess/index.js";

/**
 * `canUserRead` for pages (D61, D133, R48): the page is read as the current identity, only the WB
 * access check runs as the other user.
 */
class WbPageReviewTargetAccessImpl implements ReviewTargetAccess.Interface {
    public constructor(
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private runAsUser: RunAsUser.Interface
    ) {}

    public canAccess(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async canUserRead(params: ReviewTargetAccess.UserReadParams): Promise<boolean> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.page.entryId !== params.targetId) {
            return false;
        }
        return this.runAsUser.run(params.userId, () => this.access.canRead(target));
    }
}

export const WbPageReviewTargetAccess = ReviewTargetAccess.createImplementation({
    implementation: WbPageReviewTargetAccessImpl,
    dependencies: [WbPageTargetReader, WbPageAccess, RunAsUser]
});
```

Replace `packages/api-website-builder-workflows/src/features/target/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { WbPageReviewNamespace } from "./WbPageReviewNamespace.js";
import { WbPageTargetReader } from "./WbPageTargetReader/WbPageTargetReader.js";
import { WbPageAccess } from "./WbPageAccess/WbPageAccess.js";
import { WbPageReviewTargetLoader } from "./WbPageReviewTargetLoader.js";
import { WbPageReviewTargetSync } from "./WbPageReviewTargetSync.js";
import { WbPageReviewTargetAccess } from "./WbPageReviewTargetAccess.js";

/** The `wb.page` target adapter (spec 9.3). */
export const WbTargetFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Target",
    register(container) {
        // Lets the single CMS handlers cover pages (R51).
        container.register(WbPageReviewNamespace);
        container.register(WbPageTargetReader);
        container.register(WbPageAccess);

        // Engine ports, one per namespace (R28, R50).
        container.register(WbPageReviewTargetLoader);
        container.register(WbPageReviewTargetSync);
        container.register(WbPageReviewTargetAccess);
    }
});
```

- [ ] **Step 4: Implement the page rules**

Create `packages/api-website-builder-workflows/src/features/hooks/RequireApprovedReviewOnPagePublish.ts`:

```ts
import { PageBeforePublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Publish rule of the `wb.page` adapter (spec 5.1, D79, D121, R53): with a pages workflow, a page
 * revision is published only with its active review approved. Lookup failures block. The CMS
 * adapter's publish rule skips pages (private model, R52).
 */
class RequireApprovedReviewOnPagePublishImpl implements PageBeforePublishEventHandler.Interface {
    public constructor(
        private listWorkflows: ListWorkflowsUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: PageBeforePublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const workflows = await this.listWorkflows.execute({
            where: { models_in: [WB_PAGE_NAMESPACE] },
            limit: 1
        });
        if (workflows.isFail()) {
            throw workflows.error;
        }
        const [workflow] = workflows.value.items;
        if (!workflow) {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: page.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (review.value?.state === "approved") {
            return;
        }

        throw new ReviewPublishBlockedError({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: page.id,
            workflowId: workflow.id,
            reviewState: review.value?.state ?? null
        });
    }
}

export const RequireApprovedReviewOnPagePublish =
    PageBeforePublishEventHandler.createImplementation({
        implementation: RequireApprovedReviewOnPagePublishImpl,
        dependencies: [ListWorkflowsUseCase, GetTargetReviewUseCase]
    });
```

Create `packages/api-website-builder-workflows/src/features/hooks/BlockPageMoveWhileInReview.ts`:

```ts
import { PageBeforeMoveEventHandler } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Move rule of the `wb.page` adapter (spec 9.3, D84, R55). WB `MovePage` writes through
 * `MoveEntryRepository`, so no CMS move event fires; this listens to the page event. Any revision
 * in review blocks (A24); lookup failures block.
 */
class BlockPageMoveWhileInReviewImpl implements PageBeforeMoveEventHandler.Interface {
    public constructor(private listTargetReviews: ListTargetReviewsUseCase.Interface) {}

    public async handle(event: PageBeforeMoveEventHandler.Event): Promise<void> {
        const { original } = event.payload;

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: original.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.find(review => review.state === "inProgress");
        if (!inProgress) {
            return;
        }

        throw new ReviewTargetLockedError({
            reviewId: inProgress.id,
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: inProgress.targetRevisionId,
            reviewState: inProgress.state,
            action: "move"
        });
    }
}

export const BlockPageMoveWhileInReview = PageBeforeMoveEventHandler.createImplementation({
    implementation: BlockPageMoveWhileInReviewImpl,
    dependencies: [ListTargetReviewsUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/hooks/DeleteReviewsOnPageDelete.ts`:

```ts
import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Deletes every review of a permanently deleted page with its assignment records (spec 9.3, R56).
 * `DeletePage` deletes a page from the trash; trashing keeps the reviews (A22).
 */
class DeleteReviewsOnPageDeleteImpl implements PageAfterDeleteEventHandler.Interface {
    public constructor(private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface) {}

    public async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        const deleted = await this.deleteTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: page.entryId
        });
        if (deleted.isFail()) {
            throw deleted.error;
        }
    }
}

export const DeleteReviewsOnPageDelete = PageAfterDeleteEventHandler.createImplementation({
    implementation: DeleteReviewsOnPageDeleteImpl,
    dependencies: [DeleteTargetReviewsUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/hooks/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RequireApprovedReviewOnPagePublish } from "./RequireApprovedReviewOnPagePublish.js";
import { BlockPageMoveWhileInReview } from "./BlockPageMoveWhileInReview.js";
import { DeleteReviewsOnPageDelete } from "./DeleteReviewsOnPageDelete.js";

/**
 * `wb.page` adapter rules on the Website Builder page events (R52). Revision create and the save
 * block for pages are the single CMS handlers (R51).
 */
export const WbHooksFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Hooks",
    register(container) {
        container.register(RequireApprovedReviewOnPagePublish);
        container.register(BlockPageMoveWhileInReview);
        container.register(DeleteReviewsOnPageDelete);
    }
});
```

In `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts` import `WbHooksFeature` from `./features/hooks/feature.js` and add after `WbTargetFeature.register(container);`:

```ts
        WbHooksFeature.register(container);
```

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`), then commit:

```
feat(api-website-builder-workflows): add the page adapter and page publish, move and delete rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
