import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
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
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { AssignmentPageSize } from "~/features/review/DeleteTargetReviews/AssignmentPageSize.js";
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
const createTargetData = async (pageSize?: number) => {
    const { context } = await createContextHandler();
    if (pageSize) {
        context.container.registerInstance(AssignmentPageSize, { value: pageSize });
    }
    const reviews = context.container.resolve(ReviewRepository);
    const assignments = context.container.resolve(AssignmentRepository);
    const faults = { failDeleteOnce: false };
    // The use case gets this wrapper; the test keeps using the real repository.
    context.container.registerInstance(AssignmentRepository, {
        create: values => assignments.create(values),
        list: params => assignments.list(params),
        delete: async id => {
            if (faults.failDeleteOnce) {
                faults.failDeleteOnce = false;
                return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
            }
            return assignments.delete(id);
        }
    });

    expectOk(await reviews.save(toSaveData(createRequestedReview({ id: "review-1" }))));
    expectOk(
        await reviews.save(
            toSaveData(
                createRequestedReview({ id: "review-2", targetRevisionId: "article-1#0002" })
            )
        )
    );
    expectOk(
        await reviews.save(
            toSaveData(
                createRequestedReview({ id: "review-3", targetRevisionId: "article-2#0001" })
            )
        )
    );
    for (const hour of ["10", "11", "12"]) {
        expectOk(await assignments.create(record("review-1", `2026-10-09T${hour}:00:00.000Z`)));
    }
    expectOk(await assignments.create(record("review-3", "2026-10-09T10:00:00.000Z")));

    return {
        reviews,
        assignments,
        faults,
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

    it("deletes every assignment record when they span several pages", async () => {
        const { assignments, deleteTargetReviews } = await createTargetData(2);

        expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);
    });

    it("fails with a typed error on a partial failure and a re-run finishes the delete", async () => {
        const { reviews, assignments, faults, deleteTargetReviews } = await createTargetData();
        faults.failDeleteOnce = true;

        const failed = await deleteTargetReviews.execute({
            model: ARTICLE_MODEL,
            targetId: "article-1"
        });

        expect(failed.isFail()).toBe(true);
        expect(failed.error?.code).toBe("Workflows/Review/Persistence");
        // Records go first, so the review is still there for the retry to find.
        expect(expectOk(await reviews.get("review-1")).id).toBe("review-1");

        const rerun = expectOk(
            await deleteTargetReviews.execute({ model: ARTICLE_MODEL, targetId: "article-1" })
        );

        expect([...rerun.deletedReviewIds].sort()).toEqual(["review-1", "review-2"]);
        expect((await reviews.get("review-1")).error?.code).toBe("Workflows/Review/NotFound");
        expect((await reviews.get("review-2")).error?.code).toBe("Workflows/Review/NotFound");
        const records = expectOk(await assignments.list({ where: { reviewId: "review-1" } }));
        expect(records.items).toEqual([]);
    });
});
