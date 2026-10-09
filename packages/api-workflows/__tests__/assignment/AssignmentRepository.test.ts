import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, otherReviewer, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";

const createRepository = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(AssignmentRepository);
};

const record = (overrides: Partial<AssignmentRecordValues>): AssignmentRecordValues => {
    return {
        reviewId: "review-1",
        workflowId: "workflow-1",
        stepId: "legal",
        userId: null,
        assignedOn: "2026-10-09T10:00:00.000Z",
        source: "pool",
        by: null,
        reason: null,
        ...overrides
    };
};

/** review-1/legal: pool at 10:00, take over at 11:00; review-2/editorial: pick at 12:00. */
const createLog = async () => {
    const repository = await createRepository();
    const pool = expectOk(await repository.create(record({ reason: "No eligible candidates." })));
    expectOk(
        await repository.create(
            record({
                userId: otherReviewer.id,
                assignedOn: "2026-10-09T11:00:00.000Z",
                source: "takeOver",
                by: otherReviewer
            })
        )
    );
    expectOk(
        await repository.create(
            record({
                reviewId: "review-2",
                stepId: "editorial",
                userId: reviewer.id,
                assignedOn: "2026-10-09T12:00:00.000Z",
                source: "picked"
            })
        )
    );
    return { repository, pool };
};

describe("AssignmentRepository", () => {
    it("records assignment decisions and lists a review's records newest first", async () => {
        const { repository, pool } = await createLog();

        expect(pool).toEqual({
            id: expect.any(String),
            reviewId: "review-1",
            workflowId: "workflow-1",
            stepId: "legal",
            userId: null,
            assignedOn: "2026-10-09T10:00:00.000Z",
            source: "pool",
            by: null,
            reason: "No eligible candidates."
        });

        const byReview = expectOk(await repository.list({ where: { reviewId: "review-1" } }));
        expect(byReview.items.map(item => item.source)).toEqual(["takeOver", "pool"]);
        expect(byReview.items[0].by).toEqual(otherReviewer);
        expect(byReview.meta.hasMoreItems).toBe(false);
    });

    it("filters by workflow and step, and by review and step", async () => {
        const { repository } = await createLog();

        const byWorkflowStep = expectOk(
            await repository.list({ where: { workflowId: "workflow-1", stepId: "editorial" } })
        );
        const byReviewStep = expectOk(
            await repository.list({ where: { reviewId: "review-1", stepId: "legal" } })
        );

        expect(byWorkflowStep.items.map(item => item.userId)).toEqual([reviewer.id]);
        expect(byReviewStep.items.map(item => item.source)).toEqual(["takeOver", "pool"]);
    });

    it("filters by one user or a set of users, newest first", async () => {
        const { repository } = await createLog();

        const byUser = expectOk(await repository.list({ where: { userId: reviewer.id } }));
        const byUsers = expectOk(
            await repository.list({ where: { userId_in: [reviewer.id, otherReviewer.id] } })
        );

        expect(byUser.items.map(item => item.source)).toEqual(["picked"]);
        expect(byUsers.items.map(item => item.userId)).toEqual([reviewer.id, otherReviewer.id]);
    });

    it("pages past one page with a cursor", async () => {
        const repository = await createRepository();
        for (const hour of ["10", "11", "12"]) {
            expectOk(
                await repository.create(
                    record({ reviewId: "review-3", assignedOn: `2026-10-09T${hour}:00:00.000Z` })
                )
            );
        }

        const first = expectOk(
            await repository.list({ where: { reviewId: "review-3" }, limit: 2 })
        );
        expect(first.items.map(item => item.assignedOn)).toEqual([
            "2026-10-09T12:00:00.000Z",
            "2026-10-09T11:00:00.000Z"
        ]);
        expect(first.meta.hasMoreItems).toBe(true);

        const second = expectOk(
            await repository.list({
                where: { reviewId: "review-3" },
                limit: 2,
                after: first.meta.cursor
            })
        );
        expect(second.items.map(item => item.assignedOn)).toEqual(["2026-10-09T10:00:00.000Z"]);
        expect(second.meta.hasMoreItems).toBe(false);
    });
});
