### Task 5: Delete a target's reviews and their assignment records

Spec 9.3 ("delete the review when the target is permanently deleted"), 4.3 ("deleted with its review"), R56. One internal use case deletes every review of a target (or of one revision) and each review's assignment-log records, using the 1a.4 cursor paging by `reviewId` (R23). The adapters call it from their after-delete handlers (Tasks 10b, 16b).

**Files:**
- Modify: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`
- Modify: `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`
- Create: `packages/api-workflows/src/features/review/DeleteTargetReviews/abstractions.ts`
- Create: `packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts`
- Create: `packages/api-workflows/src/features/review/DeleteTargetReviews/feature.ts`
- Create: `packages/api-workflows/src/features/review/DeleteTargetReviews/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes: `ReviewRepository.listByTarget` (Task 4), `AssignmentRepository.list` (1a.4), CMS `DeleteEntryUseCase` (`execute(model, id, { permanently: true })`).
- Produces:
  - `ReviewRepository.Interface.delete(id: string): Promise<Result<void, ReviewPersistenceError>>` (a missing review counts as deleted).
  - `AssignmentRepository.Interface.delete(id: string): Promise<Result<void, AssignmentPersistenceError>>` (same).
  - `DeleteTargetReviewsUseCase.Interface.execute(input: DeleteTargetReviewsInput): Promise<Result<DeleteTargetReviewsResult, ReviewPersistenceError>>`, `DeleteTargetReviewsInput { model: string; targetId: string; targetRevisionId?: string | null }`, `DeleteTargetReviewsResult { deletedReviewIds: string[] }`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    expectOk,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { DeleteTargetReviewsUseCase } from "~/features/review/DeleteTargetReviews/index.js";

const record = (reviewId: string, assignedOn: string): AssignmentRecordValues => {
    return {
        reviewId,
        workflowId: "workflow-1",
        stepId: "legal",
        userId: reviewer.id,
        assignedOn,
        source: "picked",
        by: null,
        reason: null
    };
};

/**
 * article-1#0001: review-1 with three assignment records; article-1#0002: review-2;
 * article-2#0001: review-3 with one record.
 */
const createTargetData = async () => {
    const { context } = await createContextHandler();
    const reviews = context.container.resolve(ReviewRepository);
    const assignments = context.container.resolve(AssignmentRepository);

    expectOk(await reviews.save(toSaveData(createRequestedReview({ id: "review-1" }))));
    expectOk(
        await reviews.save(
            toSaveData(createRequestedReview({ id: "review-2", targetRevisionId: "article-1#0002" }))
        )
    );
    expectOk(
        await reviews.save(
            toSaveData(createRequestedReview({ id: "review-3", targetRevisionId: "article-2#0001" }))
        )
    );
    for (const hour of ["10", "11", "12"]) {
        expectOk(await assignments.create(record("review-1", `2026-10-09T${hour}:00:00.000Z`)));
    }
    expectOk(await assignments.create(record("review-3", "2026-10-09T10:00:00.000Z")));

    return {
        reviews,
        assignments,
        deleteTargetReviews: context.container.resolve(DeleteTargetReviewsUseCase)
    };
};

describe("DeleteTargetReviewsUseCase", () => {
    it("deletes a target's reviews and their assignment records", async () => {
        const { reviews, assignments, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect([...result.deletedReviewIds].sort()).toEqual(["review-1", "review-2"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        expect((await reviews.get("review-2")).error?.code).toBe("Workflows/Review/NotFound");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);

        // Another target keeps its review and records.
        expect(expectOk(await reviews.get("review-3")).id).toBe("review-3");
        const kept = expectOk(await assignments.list({ where: { reviewId: "review-3" } }));
        expect(kept.items).toHaveLength(1);
    });

    it("deletes only the reviews of one revision when it is given", async () => {
        const { reviews, assignments, deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0002"
            })
        );

        expect(result.deletedReviewIds).toEqual(["review-2"]);
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toHaveLength(3);
    });

    it("deletes nothing for a target without reviews", async () => {
        const { deleteTargetReviews } = await createTargetData();

        const result = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-9" })
        );

        expect(result.deletedReviewIds).toEqual([]);
    });

    it("treats an already deleted review or record as deleted", async () => {
        const { reviews, assignments } = await createTargetData();

        expectOk(await reviews.delete("review-1"));
        const again = await reviews.delete("review-1");
        const missingRecord = await assignments.delete("missing-record");

        expect(again.isOk()).toBe(true);
        expect(missingRecord.isOk()).toBe(true);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/DeleteTargetReviews/index.js`.

- [ ] **Step 3: Delete in the repositories**

In `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`, add to `IReviewRepository` after `save`:

```ts
    /** Permanently deletes a review; a missing review counts as deleted. */
    delete(id: string): Promise<Result<void, ReviewPersistenceError>>;
```

In `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`:

1. Add `import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";`.
2. Add `private deleteEntry: DeleteEntryUseCase.Interface` as the last constructor parameter and `DeleteEntryUseCase` as the last item of `dependencies`.
3. Add after `save`:

```ts
    async delete(id: string): Promise<Result<void, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.deleteEntry.execute(model, createIdentifier({ id, version: 1 }), {
            permanently: true
        });
        if (result.isFail() && result.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok();
    }
```

In `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`, add to `IAssignmentRepository` after `list`:

```ts
    /** Permanently deletes a record (with its review, spec 4.3); a missing record counts as deleted. */
    delete(id: string): Promise<Result<void, AssignmentPersistenceError>>;
```

In `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`:

1. Add `import { createIdentifier } from "@webiny/utils";` and `import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";`, and `const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";` under `DEFAULT_LIMIT`.
2. Add `private deleteEntry: DeleteEntryUseCase.Interface` as the last constructor parameter; `dependencies: [AssignmentModelProvider, ListLatestEntriesUseCase, CreateEntryUseCase, DeleteEntryUseCase]`.
3. Add after `list`:

```ts
    async delete(id: string): Promise<Result<void, AssignmentPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.deleteEntry.execute(model, createIdentifier({ id, version: 1 }), {
            permanently: true
        });
        if (result.isFail() && result.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }
        return Result.ok();
    }
```

(Records are created without an id; `AssignmentEntryMapper.fromEntry` returns the entry id without the version, so `createIdentifier({ id, version: 1 })` addresses the only revision.)

- [ ] **Step 4: Add DeleteTargetReviews**

Create `packages/api-workflows/src/features/review/DeleteTargetReviews/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface DeleteTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    /** Only this revision's reviews; every revision of the target when omitted. */
    targetRevisionId?: string | null;
}

export interface DeleteTargetReviewsResult {
    deletedReviewIds: string[];
}

export interface IDeleteTargetReviewsUseCaseErrors {
    persistence: ReviewPersistenceError;
}

type UseCaseError = IDeleteTargetReviewsUseCaseErrors[keyof IDeleteTargetReviewsUseCaseErrors];

export interface IDeleteTargetReviewsUseCase {
    execute(
        input: DeleteTargetReviewsInput
    ): Promise<Result<DeleteTargetReviewsResult, UseCaseError>>;
}

/**
 * Deletes the reviews of a permanently deleted target and their assignment-log records (spec 4.3,
 * 9.3, R56). Internal (D132): called by the app adapters' after-delete handlers.
 */
export const DeleteTargetReviewsUseCase = createAbstraction<IDeleteTargetReviewsUseCase>(
    "DeleteTargetReviewsUseCase"
);

export namespace DeleteTargetReviewsUseCase {
    export type Interface = IDeleteTargetReviewsUseCase;
    export type Input = DeleteTargetReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<DeleteTargetReviewsResult, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/DeleteTargetReviews/DeleteTargetReviewsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { DeleteTargetReviewsUseCase as UseCase } from "./abstractions.js";

const ASSIGNMENT_PAGE_SIZE = 100;

class DeleteTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private reviewRepository: ReviewRepository.Interface,
        private assignmentRepository: AssignmentRepository.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.reviewRepository.listByTarget({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? undefined
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        const deletedReviewIds: string[] = [];
        for (const review of listed.value) {
            // Records first: a failure leaves the review in place, so a retry finds it again.
            const records = await this.deleteAssignmentRecords(review.id);
            if (records.isFail()) {
                return Result.fail(new ReviewPersistenceError(records.error));
            }
            const deleted = await this.reviewRepository.delete(review.id);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
            deletedReviewIds.push(review.id);
        }

        return Result.ok({ deletedReviewIds });
    }

    /** Collects every record id first, so deleting does not shift the cursor pages (R23). */
    private async deleteAssignmentRecords(
        reviewId: string
    ): Promise<Result<void, AssignmentPersistenceError>> {
        const ids: string[] = [];
        let after: string | null = null;
        do {
            const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                await this.assignmentRepository.list({
                    where: { reviewId },
                    limit: ASSIGNMENT_PAGE_SIZE,
                    after
                });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            ids.push(...page.value.items.map(item => item.id));
            after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
        } while (after);

        for (const id of ids) {
            const deleted = await this.assignmentRepository.delete(id);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
        }
        return Result.ok();
    }
}

export const DeleteTargetReviewsUseCase = UseCase.createImplementation({
    implementation: DeleteTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository, AssignmentRepository]
});
```

Create `packages/api-workflows/src/features/review/DeleteTargetReviews/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DeleteTargetReviewsUseCase } from "./DeleteTargetReviewsUseCase.js";

export const DeleteTargetReviewsFeature = createFeature({
    name: "Workflows/DeleteTargetReviews",
    register(container) {
        container.register(DeleteTargetReviewsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/DeleteTargetReviews/index.ts`:

```ts
export { DeleteTargetReviewsUseCase } from "./abstractions.js";
export type { DeleteTargetReviewsInput, DeleteTargetReviewsResult } from "./abstractions.js";
```

- [ ] **Step 5: Register and pin the registration**

In `packages/api-workflows/src/WorkflowsFeature.ts` import `DeleteTargetReviewsFeature` from `~/features/review/DeleteTargetReviews/feature.js` and register it after `ListTargetReviewsFeature.register(container);`. In `__tests__/registration.test.ts` import `DeleteTargetReviewsUseCase` from its `index.js` and add `expect(container.resolveAll(DeleteTargetReviewsUseCase)).toHaveLength(1);` after the `ListTargetReviewsUseCase` expectation.

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then commit:

```
feat(api-workflows): delete a target's reviews and their assignment records

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
