### Task 14b: CMS cancel-for-delete wrapper (the confirm path of D134)

D134 points 1 and 3, R45, R73, R74, R85. Trashing or deleting a CMS entry (or one revision) with a review in progress is refused (Task 10b). When the user confirms in the admin, the admin calls `CancelCmsEntryReviewsForDeleteUseCase` and then repeats the trash or delete, which passes. The wrapper:

1. reads the identity (`CurrentReviewViewer.getActor()`; API keys included);
2. keeps to `cms.*` namespaces (R46);
3. checks the model-level delete permission (`CmsEntryAccess.canDeleteAnyEntry(model)`: group and model read, `AccessControl.canAccessEntry({ model, rwd: "d" })` as `DeleteEntryUseCase` does) before it reads any entry or lists any review, so the answer never reveals whether content has a review in progress (R86, same as R75);
4. lists the target's in-progress reviews (only the deleted revision's when `targetRevisionId` is given); none means nothing to do;
5. checks that the caller may delete the content (`CmsEntryAccess.canDelete`: group and model read, entry `d`, folder `d`) on the first in-progress review's revision (entry permissions and the folder are entry-level, so one revision answers for all); no `workflows` permission and no cancel right is needed (D134: anyone who may trash the content may confirm);
6. cancels the reviews through `CancelTargetReviewsUseCase` as the caller, with reason "content trashed" or "content deleted" (`getDeleteCancelReason`). `CancelTargetReviewsUseCase` stops at the first failure and returns that error; the reviews cancelled before it stay cancelled, and repeating the call finishes the rest. A failed R16 sync on a cancelled review leaves that review cancelled while the target's `system.workflow` is still unsynced.

Why a separate wrapper and not a flag on the trash operation (R74): the CMS trash and delete inputs, their GraphQL mutations, the `EntryBeforeDelete` payloads and the bulk-action tasks would all have to carry a workflows option; the wrapper needs no change outside the workflows packages, follows D132 (identity and checks in the app wrapper, engine call after), and covers trash, entry delete, revision delete and `deleteMultiple` alike. The two calls are not atomic: if the trash then fails (e.g. a storage error), the review stays cancelled; the user confirmed losing it, and a new review can be requested (A35).

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/abstractions.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/CancelCmsEntryReviewsForDeleteUseCase.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/feature.ts`
- Create: `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/index.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts`

**Interfaces:**
- Consumes: `CurrentReviewViewer` (`getActor()`), `ListTargetReviewsUseCase` (Task 4), `CancelTargetReviewsUseCase` (Task 5b), `ReviewActiveOnTrashAction`, `ReviewTargetNotFoundError` (Task 6), `getDeleteCancelReason` (Task 6b), `CmsEntryTargetReader`, `CmsEntryAccess.canDeleteAnyEntry` and `.canDelete` (Task 7), `isCmsNamespace`, `RecordingEventPublisher` (Task 12, test).
- Produces:
  - `CancelCmsEntryReviewsForDeleteUseCase.Interface.execute(input: CancelCmsEntryReviewsForDeleteInput): Promise<Result<ReviewData[], CancelCmsEntryReviewsForDeleteUseCase.Error>>` (the cancelled reviews), `CancelCmsEntryReviewsForDeleteInput { model: string; targetId: string; targetRevisionId?: string | null; action: ReviewActiveOnTrashAction }`.
  - Action text `"cancel the review to delete this content"` (delete access refused).

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import { approveEntryReview, requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { toActor, WRITER } from "~tests/__helpers/identities.js";
import { CMS_DELETER, CMS_WRITER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";

/** Admin stores the workflow; REQUESTER's review is in progress on one entry. */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    return { admin, entry, review };
};

/** WRITER with delete rights and no workflows permission, recording events (R80). */
const createDeleterContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: WRITER,
        permissions: CMS_DELETER,
        legacyPlugins: [
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

const cancelForDelete = (context: CmsContext, input: CancelCmsEntryReviewsForDeleteUseCase.Input) => {
    return context.container.resolve(CancelCmsEntryReviewsForDeleteUseCase).execute(input);
};

const cancelledFacts = () => {
    return recordedEvents
        .filter(event => event.eventType === "Workflows/Review/Cancelled")
        .map(event => event.payload.fact);
};

describe("CMS cancel-for-delete wrapper (D134)", () => {
    afterEach(() => {
        folderLevels.clear();
    });

    it("lets a user who may trash the content cancel its review, then trash it", async () => {
        const { admin, entry, review } = await createScenario();
        const deleter = await createDeleterContext();

        const refused = await trash(deleter, entry);
        const cancelled = expectOk(
            await cancelForDelete(deleter, {
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                action: "trash"
            })
        );
        const trashed = await trash(deleter, entry);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(cancelled.map(item => item.id)).toEqual([review.id]);
        expect(cancelledFacts()).toEqual([
            expect.objectContaining({ actor: toActor(WRITER), reason: "content trashed" })
        ]);
        expect(trashed.isOk()).toBe(true);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("cancelled");
    });

    it("cancels only the deleted revision's review, with the delete reason", async () => {
        const { admin, entry } = await createScenario();
        // Revision 1's review is in progress; revision 2 gets its own.
        const model = await getAuthorModel(admin);
        const second = expectOk(
            await admin.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, entry.id, { values: {} })
        );
        const secondReview = await requestEntryReview(admin, second);
        const deleter = await createDeleterContext();

        const cancelled = expectOk(
            await cancelForDelete(deleter, {
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: second.id,
                action: "delete"
            })
        );
        const deleted = await deleter.container
            .resolve(DeleteEntryRevisionUseCase)
            .execute(model, second.id);

        expect(cancelled.map(item => item.id)).toEqual([secondReview.id]);
        expect(cancelledFacts()).toEqual([expect.objectContaining({ reason: "content deleted" })]);
        expect(deleted.isOk()).toBe(true);
    });

    it("refuses a user who cannot delete the content, and keeps the review", async () => {
        const { admin, entry, review } = await createScenario();
        const writer = await createUserContext({ identity: WRITER, permissions: CMS_WRITER });

        const result = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel the review to delete this content" });
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("answers a user without delete permission the same for an entry with and without a review (R86)", async () => {
        const { admin, entry } = await createScenario();
        const idle = await createAuthorEntry(admin, { name: "Bob" });
        const writer = await createUserContext({ identity: WRITER, permissions: CMS_WRITER });

        const withReview = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });
        const withoutReview = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: idle.entryId,
            action: "trash"
        });
        const missing = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: "missing-entry",
            action: "trash"
        });

        expect(withReview.error.code).toBe("Workflows/NotAuthorized");
        expect(withoutReview.error.code).toBe(withReview.error.code);
        expect(withoutReview.error.data).toEqual(withReview.error.data);
        expect(missing.error.code).toBe(withReview.error.code);
        expect(missing.error.data).toEqual(withReview.error.data);
    });

    it("refuses a user without folder delete access", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Locked", folderId: "folder-locked" });
        await requestEntryReview(admin, entry);
        // ACO `viewer` may read but not write or delete folder content.
        folderLevels.set("folder-locked", new Map([[WRITER.id, "viewer"]]));
        const deleter = await createDeleterContext();

        const result = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
    });

    it("cancels nothing when no review is in progress", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        await approveEntryReview(admin, await requestEntryReview(admin, entry));
        const deleter = await createDeleterContext();

        const cancelled = expectOk(
            await cancelForDelete(deleter, {
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                action: "trash"
            })
        );

        expect(cancelled).toEqual([]);
    });

    it("reports another app's namespace as not found and refuses an anonymous identity", async () => {
        const { entry } = await createScenario();
        const deleter = await createDeleterContext();
        const anonymous = await createUserContext({ identity: null, permissions: [] });

        const otherApp = await cancelForDelete(deleter, {
            model: "wb.page",
            targetId: entry.entryId,
            action: "trash"
        });
        const unauthenticated = await cancelForDelete(anonymous, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(unauthenticated.error.code).toBe("Workflows/NotAuthenticated");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js`.

- [ ] **Step 3: The wrapper**

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type {
    ReviewActiveOnTrashAction,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import type { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";

export interface CancelCmsEntryReviewsForDeleteInput {
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    /** The entry id. */
    targetId: string;
    /** Deleting one revision: only its review. Omitted for trash and entry delete. */
    targetRevisionId?: string | null;
    /** Recorded as the cancel reason: "content trashed" or "content deleted". */
    action: ReviewActiveOnTrashAction;
}

export interface ICancelCmsEntryReviewsForDeleteUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    list: ListTargetReviewsUseCase.Error;
    cancel: CancelTargetReviewsUseCase.Error;
}

type UseCaseError =
    ICancelCmsEntryReviewsForDeleteUseCaseErrors[keyof ICancelCmsEntryReviewsForDeleteUseCaseErrors];

export interface ICancelCmsEntryReviewsForDeleteUseCase {
    execute(
        input: CancelCmsEntryReviewsForDeleteInput
    ): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * The confirm path for trashing or deleting a CMS entry or revision with a review in progress
 * (D134, R74): cancels the in-progress reviews as the caller, who needs delete access to the
 * content and no cancel right. The admin calls it, then repeats the trash or delete.
 */
export const CancelCmsEntryReviewsForDeleteUseCase =
    createAbstraction<ICancelCmsEntryReviewsForDeleteUseCase>(
        "CancelCmsEntryReviewsForDeleteUseCase"
    );

export namespace CancelCmsEntryReviewsForDeleteUseCase {
    export type Interface = ICancelCmsEntryReviewsForDeleteUseCase;
    export type Input = CancelCmsEntryReviewsForDeleteInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/CancelCmsEntryReviewsForDeleteUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewTargetNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import { getDeleteCancelReason } from "@webiny/api-workflows/domain/review/getDeleteCancelReason.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CancelCmsEntryReviewsForDeleteUseCase as UseCase } from "./abstractions.js";

class CancelCmsEntryReviewsForDeleteUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private cancelTargetReviews: CancelTargetReviewsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        if (!isCmsNamespace(input.model)) {
            return Result.fail(this.notFound(input));
        }

        // Model-level check first: the answer must not reveal whether content has a review in
        // progress or exists at all (R86, same as R75).
        if (!(await this.access.canDeleteAnyEntry(input.model))) {
            return Result.fail(this.notAuthorized());
        }

        const reviews = await this.listTargetReviews.execute({
            model: input.model,
            targetId: input.targetId
        });
        if (reviews.isFail()) {
            return Result.fail(reviews.error);
        }
        const inProgress = reviews.value.filter(review => {
            if (review.state !== "inProgress") {
                return false;
            }
            return !input.targetRevisionId || review.targetRevisionId === input.targetRevisionId;
        });
        if (inProgress.length === 0) {
            return Result.ok([]);
        }

        // Entry permissions (own) and the folder are entry-level: one revision answers for all.
        const target = await this.targets.read({
            model: input.model,
            targetRevisionId: inProgress[0].targetRevisionId
        });
        if (!target || target.entry.entryId !== input.targetId) {
            return Result.fail(this.notFound(input));
        }
        if (!(await this.access.canDelete(target))) {
            return Result.fail(this.notAuthorized());
        }

        return this.cancelTargetReviews.execute({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? null,
            actor: actor.value,
            reason: getDeleteCancelReason(input.action)
        });
    }

    private notAuthorized(): WorkflowsNotAuthorizedError {
        return new WorkflowsNotAuthorizedError({
            action: "cancel the review to delete this content"
        });
    }

    private notFound(input: UseCase.Input): ReviewTargetNotFoundError {
        return new ReviewTargetNotFoundError({
            model: input.model,
            targetRevisionId: input.targetRevisionId ?? input.targetId
        });
    }
}

export const CancelCmsEntryReviewsForDeleteUseCase = UseCase.createImplementation({
    implementation: CancelCmsEntryReviewsForDeleteUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        ListTargetReviewsUseCase,
        CmsEntryTargetReader,
        CmsEntryAccess,
        CancelTargetReviewsUseCase
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelCmsEntryReviewsForDeleteUseCase } from "./CancelCmsEntryReviewsForDeleteUseCase.js";

export const CancelCmsEntryReviewsForDeleteFeature = createFeature({
    name: "CmsWorkflows/CancelCmsEntryReviewsForDelete",
    register(container) {
        container.register(CancelCmsEntryReviewsForDeleteUseCase);
    }
});
```

Create `packages/api-headless-cms-workflows/src/features/wrappers/CancelCmsEntryReviewsForDelete/index.ts`:

```ts
export { CancelCmsEntryReviewsForDeleteUseCase } from "./abstractions.js";
export type { CancelCmsEntryReviewsForDeleteInput } from "./abstractions.js";
```

- [ ] **Step 4: Register and pin the registration**

In `packages/api-headless-cms-workflows/src/features/wrappers/feature.ts` import `CancelCmsEntryReviewsForDeleteFeature` from `./CancelCmsEntryReviewsForDelete/feature.js` and add after `CancelCmsEntryReviewFeature.register(container);`:

```ts
        // Confirm path for trash and delete with a review in progress (D134)
        CancelCmsEntryReviewsForDeleteFeature.register(container);
```

In `packages/api-headless-cms-workflows/__tests__/registration.test.ts` import `CancelCmsEntryReviewsForDeleteUseCase` from `~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js` and add it to the list of wrapper abstractions after `CancelCmsEntryReviewUseCase`.

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): cancel an entry's reviews before it is trashed or deleted

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
