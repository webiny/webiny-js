### Task 8: CMS loader, sync and read access for another user

Spec 9.3, R48, R50, R63, R66, A19, A20. The `cms.*` implementations of the three engine ports:

- `CmsEntryReviewTargetLoader` (`ReviewTargetLoader`): title and typed `TargetContext` of a CMS revision.
- `CmsEntryReviewTargetSync` (`ReviewTargetSync`): writes `system.workflow` with `UpdateEntrySystemUseCase` inside `withoutAuthorization`, after reading the model as the current identity.
- `CmsEntryReviewTargetAccess` (`ReviewTargetAccess`): reads the model and revision as the current identity, then evaluates `CmsEntryAccess.canRead` as the other user through `RunAsUser`.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/target/toCmsReviewTarget.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetLoader.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetSync.ts`
- Create: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetAccess.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/target/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/__helpers/engine.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts`

**Interfaces:**
- Consumes: `CmsEntryTargetReader`, `CmsEntryAccess` (Task 7), `ReviewTargetLoader`, `ReviewTargetSync` (1a), `ReviewTargetAccess`, `RunAsUser` (Task 6), `GetModelUseCase`, `UpdateEntrySystemUseCase`, `IdentityContext`, `getEntryTitle` (`@webiny/api-headless-cms/utils/getEntryTitle.js`).
- Produces:
  - `toCmsReviewTarget(target: CmsEntryTarget): ReviewTarget` (R66).
  - `CmsEntryReviewTargetLoader`, `CmsEntryReviewTargetSync`, `CmsEntryReviewTargetAccess` registered by `CmsTargetFeature`; each answers only `cms.<modelId>` namespaces.
  - Test helpers (`__tests__/__helpers/engine.ts`): `requestEntryReview(context, entry, requester?)`, `startEntryReview(context, review, reviewer?)`, `approveEntryReview(context, review)`, `rejectEntryReview(context, review)`, `cancelEntryReview(context, review)`, `readEntry(context, revisionId)`; constant `STEP_ID = "step-1"`.

- [ ] **Step 1: Write the test helpers and the failing test**

Create `packages/api-headless-cms-workflows/__tests__/__helpers/engine.ts`:

```ts
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { AUTHOR_NAMESPACE, expectOk, getAuthorModel } from "./entries.js";
import { REQUESTER, REVIEW_TEAM, REVIEWER, toActor } from "./identities.js";

/** The only step of the test workflow (`__workflows/workflow.ts`). */
export const STEP_ID = "step-1";

/** Requests a review through the engine (no wrapper checks), as `requester`. */
export const requestEntryReview = async (
    context: CmsContext,
    entry: CmsEntry,
    requester: IdentityData = REQUESTER
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(RequestReviewUseCase).execute({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            actor: toActor(requester)
        })
    );
};

export const startEntryReview = async (
    context: CmsContext,
    review: ReviewData,
    reviewer: IdentityData = REVIEWER
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(StartReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(reviewer),
            actorTeamIds: [REVIEW_TEAM]
        })
    );
};

/** Starts and approves the only step, so the review is `approved`. */
export const approveEntryReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startEntryReview(context, review);
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

/** Starts and rejects the only step, so the review is `rejected` (and stays active, D23). */
export const rejectEntryReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startEntryReview(context, review);
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

export const cancelEntryReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(CancelReviewUseCase).execute({
            reviewId: review.id,
            actor: toActor(REQUESTER)
        })
    );
};

/** The stored revision, read without access checks. */
export const readEntry = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const model = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(model, revisionId)
    );
};
```

Create `packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetAccess } from "@webiny/api-workflows/features/review/ReviewTargetAccess/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import {
    cancelEntryReview,
    readEntry,
    requestEntryReview,
    STEP_ID
} from "~tests/__helpers/engine.js";
import { ADMIN, NOBODY, READER, REVIEW_TEAM, REVIEWER, toActor } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import {
    FakeFolderLevelPermissions,
    folderLevels
} from "~tests/__helpers/FakeFolderLevelPermissions.js";

const registerFakeFlp = (container: Container) => {
    container.register(FakeFolderLevelPermissions);
};

const createAdminContext = async () => {
    const { context } = createContextHandler({
        legacyPlugins: [registerFakeFlp],
        permissionsByIdentity: {
            [READER.id]: CMS_READER,
            [NOBODY.id]: []
        }
    });
    return context();
};

describe("CMS target adapter", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("loads a CMS revision's title and typed context", async () => {
        const context = await createAdminContext();
        const inFolder = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const inRoot = await createAuthorEntry(context, { name: "Bob" });
        const loaders = context.container.resolveAll(ReviewTargetLoader);
        const loader = loaders.find(item => item.canLoad(AUTHOR_NAMESPACE))!;

        const loaded = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: inFolder.entryId,
            targetRevisionId: inFolder.id
        });
        const rootLoaded = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: inRoot.entryId,
            targetRevisionId: inRoot.id
        });

        expect(loaded).toEqual({
            title: "Ann",
            context: {
                folder: { id: "folder-1", type: "cms:author" },
                modelId: "author",
                title: "Ann",
                author: { id: ADMIN.id, displayName: ADMIN.displayName }
            }
        });
        expect(rootLoaded?.context.folder).toBeNull();
        expect(loaders.some(item => item.canLoad("wb.page"))).toBe(false);
    });

    it("loads nothing for a missing revision or a revision of another entry", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const loader = context.container
            .resolveAll(ReviewTargetLoader)
            .find(item => item.canLoad(AUTHOR_NAMESPACE))!;

        const missing = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`
        });
        const mismatched = await loader.load({
            model: AUTHOR_NAMESPACE,
            targetId: "another-entry",
            targetRevisionId: entry.id
        });

        expect(missing).toBeNull();
        expect(mismatched).toBeNull();
    });

    it("writes system.workflow on request and clears it on cancel", async () => {
        const context = await createAdminContext();
        expectOk(await storeWorkflow(context));
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const review = await requestEntryReview(context, entry);
        const requested = await readEntry(context, entry.id);
        await cancelEntryReview(context, review);
        const cancelled = await readEntry(context, entry.id);

        expect(requested.system?.workflow).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: STEP_ID,
            stepName: "Step 1",
            stepState: "awaiting"
        });
        expect(cancelled.system?.workflow).toBeNull();
        expect(context.container.resolveAll(ReviewTargetSync).some(item => item.canSync("wb.page"))).toBe(
            false
        );
    });

    it("syncs a transition made by a reviewer who can only read the entry (R63)", async () => {
        const admin = await createAdminContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        const review = await requestEntryReview(admin, entry);
        const { context } = createContextHandler({ identity: REVIEWER, permissions: CMS_READER });
        const reviewerContext = await context();

        const started = await reviewerContext.container.resolve(StartReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM]
        });

        expect(started.isOk()).toBe(true);
        expect((await readEntry(admin, entry.id)).system?.workflow?.stepState).toBe("inReview");
    });

    it("answers read access for another user with that user's permissions (R48)", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const access = context.container
            .resolveAll(ReviewTargetAccess)
            .find(item => item.canAccess(AUTHOR_NAMESPACE))!;
        const params = {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        };

        const reader = await access.canUserRead({ ...params, userId: READER.id });
        const nobody = await access.canUserRead({ ...params, userId: NOBODY.id });
        folderLevels.set("folder-1", new Map([[READER.id, "no-access"]]));
        const readerWithoutFolder = await access.canUserRead({ ...params, userId: READER.id });

        expect(reader).toBe(true);
        expect(nobody).toBe(false);
        expect(readerWithoutFolder).toBe(false);
        // The request identity and its permissions are untouched afterwards.
        expect(context.container.resolve(IdentityContext).getIdentity().id).toBe(ADMIN.id);
        expect(await createAuthorEntry(context, { name: "Still admin" })).toBeTruthy();
    });

    it("denies read access to a missing target or another app's namespace", async () => {
        const context = await createAdminContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const accesses = context.container.resolveAll(ReviewTargetAccess);
        const access = accesses.find(item => item.canAccess(AUTHOR_NAMESPACE))!;

        const missing = await access.canUserRead({
            userId: READER.id,
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: `${entry.entryId}#0009`
        });

        expect(missing).toBe(false);
        expect(accesses.some(item => item.canAccess("wb.page"))).toBe(false);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/target/CmsEntryAdapter.test.ts 2>&1 | tail -50`
Expected: FAIL, `loader` is `undefined` (no `ReviewTargetLoader` matches `cms.author`).

- [ ] **Step 3: Implement the loader**

Create `packages/api-headless-cms-workflows/src/features/target/toCmsReviewTarget.ts`:

```ts
import { getEntryTitle } from "@webiny/api-headless-cms/utils/getEntryTitle.js";
import type { ReviewTarget } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import type { CmsEntryTarget } from "./CmsEntryTargetReader/abstractions.js";

/** Title and typed `TargetContext` of a CMS revision (spec 9.3, R66). Pure. */
export const toCmsReviewTarget = (target: CmsEntryTarget): ReviewTarget => {
    const { model, entry } = target;
    const title = getEntryTitle(model, entry);
    const folderId = entry.location?.folderId;
    return {
        title,
        context: {
            folder:
                folderId && folderId !== ROOT_FOLDER
                    ? { id: folderId, type: `cms:${model.modelId}` }
                    : null,
            modelId: model.modelId,
            title,
            author: { id: entry.createdBy.id, displayName: entry.createdBy.displayName }
        }
    };
};
```

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetLoader.ts`:

```ts
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { toCmsReviewTarget } from "./toCmsReviewTarget.js";

/**
 * Loads `cms.<modelId>` targets for `RequestReviewUseCase` (spec 9.3). Runs as the requester,
 * whose write access the request wrapper has checked (D77).
 */
class CmsEntryReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    public constructor(private targets: CmsEntryTargetReader.Interface) {}

    public canLoad(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async load(
        params: ReviewTargetLoader.LoadParams
    ): Promise<ReviewTargetLoader.Target | null> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.entry.entryId !== params.targetId) {
            return null;
        }
        return toCmsReviewTarget(target);
    }
}

export const CmsEntryReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: CmsEntryReviewTargetLoaderImpl,
    dependencies: [CmsEntryTargetReader]
});
```

- [ ] **Step 4: Implement the sync**

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetSync.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";

/**
 * Writes `system.workflow` on the CMS revision (spec 4.5, D52, R63). The model is read as the
 * current identity, never without authorization: an access-free read could fill the tenant-keyed
 * CMS model cache with an unfiltered list (A19). Only the system write runs without authorization,
 * so a reviewer with read access can move the review on. `UpdateEntrySystemUseCase` does not
 * publish `EntryBeforeUpdate`, so the save block does not apply (D62).
 */
class CmsEntryReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private getModel: GetModelUseCase.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface
    ) {}

    public canSync(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        const modelId = getModelIdFromAppName(params.review.model);
        if (!modelId) {
            return Result.fail(
                new Error(`"${params.review.model}" is not a Headless CMS review namespace.`)
            );
        }

        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            return Result.fail(model.error);
        }

        const updated = await this.identityContext.withoutAuthorization(() => {
            return this.updateEntrySystem.execute(model.value, params.review.targetRevisionId, {
                workflow: params.systemWorkflow
            });
        });
        if (updated.isFail()) {
            return Result.fail(updated.error);
        }
        return Result.ok();
    }
}

export const CmsEntryReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: CmsEntryReviewTargetSyncImpl,
    dependencies: [IdentityContext, GetModelUseCase, UpdateEntrySystemUseCase]
});
```

- [ ] **Step 5: Implement read access for another user**

Create `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetAccess.ts`:

```ts
import { ReviewTargetAccess } from "@webiny/api-workflows/features/review/ReviewTargetAccess/index.js";
import { RunAsUser } from "@webiny/api-workflows/features/identity/RunAsUser/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "./CmsEntryAccess/index.js";

/**
 * `canUserRead` for `cms.*` targets (D61, D133, R48). The model and revision are read as the
 * current identity first, so no model is read as the other user (A19); only the CMS access check
 * runs as that user.
 */
class CmsEntryReviewTargetAccessImpl implements ReviewTargetAccess.Interface {
    public constructor(
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private runAsUser: RunAsUser.Interface
    ) {}

    public canAccess(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async canUserRead(params: ReviewTargetAccess.UserReadParams): Promise<boolean> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.entry.entryId !== params.targetId) {
            return false;
        }
        return this.runAsUser.run(params.userId, () => this.access.canRead(target));
    }
}

export const CmsEntryReviewTargetAccess = ReviewTargetAccess.createImplementation({
    implementation: CmsEntryReviewTargetAccessImpl,
    dependencies: [CmsEntryTargetReader, CmsEntryAccess, RunAsUser]
});
```

- [ ] **Step 6: Register**

Replace `packages/api-headless-cms-workflows/src/features/target/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsModelReviewNamespace } from "./CmsEntryReviewNamespace/CmsModelReviewNamespace.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/CmsEntryTargetReader.js";
import { CmsEntryAccess } from "./CmsEntryAccess/CmsEntryAccess.js";
import { CmsEntryReviewTargetLoader } from "./CmsEntryReviewTargetLoader.js";
import { CmsEntryReviewTargetSync } from "./CmsEntryReviewTargetSync.js";
import { CmsEntryReviewTargetAccess } from "./CmsEntryReviewTargetAccess.js";

/** The `cms.*` target adapter (spec 9.3). */
export const CmsTargetFeature = createFeature({
    name: "CmsWorkflows/Target",
    register(container) {
        container.register(CmsModelReviewNamespace);
        container.register(CmsEntryTargetReader);
        container.register(CmsEntryAccess);

        // Engine ports, one per namespace (R28, R50).
        container.register(CmsEntryReviewTargetLoader);
        container.register(CmsEntryReviewTargetSync);
        container.register(CmsEntryReviewTargetAccess);
    }
});
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): add the cms target loader, sync and read access for other users

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
