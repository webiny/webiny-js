import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk, otherReviewer, reviewer } from "~tests/__helpers/fixtures.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
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
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome",
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
    it("reads a record stored without a reason back as null", async () => {
        const repository = await createRepository();
        const created = expectOk(await repository.create(record({})));
        expect(created.reason).toBeNull();

        const listed = expectOk(await repository.list({ where: { reviewId: "review-1" } }));
        expect(listed.items).toHaveLength(1);
        expect(listed.items[0].reason).toBeNull();
    });

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
            ruleId: null,
            by: null,
            reason: "No eligible candidates.",
            kind: "outcome"
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

    it("orders by assignedOn, not insertion order, across a page boundary", async () => {
        const repository = await createRepository();
        const where = { workflowId: "workflow-ooo", stepId: "legal" };
        for (const hour of ["12", "10", "11"]) {
            expectOk(
                await repository.create(
                    record({ ...where, assignedOn: `2026-10-09T${hour}:00:00.000Z` })
                )
            );
        }

        const first = expectOk(await repository.list({ where, limit: 2 }));
        expect(first.items.map(item => item.assignedOn)).toEqual([
            "2026-10-09T12:00:00.000Z",
            "2026-10-09T11:00:00.000Z"
        ]);
        expect(first.meta.hasMoreItems).toBe(true);

        const second = expectOk(
            await repository.list({ where, limit: 2, after: first.meta.cursor })
        );
        expect(second.items.map(item => item.assignedOn)).toEqual(["2026-10-09T10:00:00.000Z"]);
        expect(second.meta.hasMoreItems).toBe(false);
    });

    it("returns an empty list for an empty userId_in without querying the CMS", async () => {
        let cmsListCalls = 0;
        const { context } = await createContextHandler({
            setup: container => {
                container.registerDecorator(
                    ListLatestEntriesUseCase.createDecorator({
                        decorator: class {
                            constructor(private decoratee: ListLatestEntriesUseCase.Interface) {}
                            async execute(
                                ...args: Parameters<ListLatestEntriesUseCase.Interface["execute"]>
                            ) {
                                cmsListCalls++;
                                return this.decoratee.execute(...args);
                            }
                        },
                        dependencies: []
                    })
                );
            }
        });
        const repository = context.container.resolve(AssignmentRepository);
        expectOk(await repository.create(record({ userId: reviewer.id })));

        const listed = expectOk(await repository.list({ where: { userId_in: [] } }));

        expect(listed.items).toEqual([]);
        expect(listed.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 0 });
        expect(cmsListCalls).toBe(0);
    });

    it("does not drop an empty-string filter", async () => {
        const { repository } = await createLog();

        const listed = expectOk(await repository.list({ where: { reviewId: "" } }));

        expect(listed.items).toEqual([]);
    });

    it("stores the kind and the rule id and reads a record stored without them as an outcome without a rule (R96, R109)", async () => {
        const { context } = await createContextHandler();
        const repository = context.container.resolve(AssignmentRepository);
        expectOk(
            await repository.create(
                record({
                    reviewId: "review-kind",
                    userId: reviewer.id,
                    source: "rule",
                    ruleId: "rule-1",
                    reason: "Excluded from reviews.",
                    kind: "skip"
                })
            )
        );
        const model = await context.container.resolve(AssignmentModelProvider).get();
        expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                createdOn: "2026-10-09T09:00:00.000Z",
                values: {
                    reviewId: "review-kind",
                    workflowId: "workflow-1",
                    stepId: "legal",
                    userId: otherReviewer.id,
                    assignedOn: "2026-10-09T09:00:00.000Z",
                    source: "roundRobin",
                    by: null,
                    reason: null
                }
            })
        );

        const listed = expectOk(await repository.list({ where: { reviewId: "review-kind" } }));

        expect(listed.items.map(item => [item.userId, item.kind, item.ruleId])).toEqual([
            [reviewer.id, "skip", "rule-1"],
            [otherReviewer.id, "outcome", null]
        ]);
    });

    it("filters by kind and by a set of workflows (R115)", async () => {
        const repository = await createRepository();
        expectOk(
            await repository.create(
                record({ reviewId: "review-k", userId: reviewer.id, source: "roundRobin" })
            )
        );
        expectOk(
            await repository.create(
                record({
                    reviewId: "review-k",
                    userId: otherReviewer.id,
                    source: "roundRobin",
                    kind: "skip",
                    reason: "Cannot read this content.",
                    assignedOn: "2026-10-09T11:00:00.000Z"
                })
            )
        );
        expectOk(
            await repository.create(
                record({
                    reviewId: "review-k",
                    workflowId: "workflow-2",
                    userId: reviewer.id,
                    source: "picked",
                    assignedOn: "2026-10-09T12:00:00.000Z"
                })
            )
        );

        const outcomes = expectOk(
            await repository.list({ where: { reviewId: "review-k", kind: "outcome" } })
        );
        const inWorkflows = expectOk(
            await repository.list({
                where: { reviewId: "review-k", workflowId_in: ["workflow-2", "workflow-3"] }
            })
        );
        const noWorkflows = expectOk(
            await repository.list({ where: { reviewId: "review-k", workflowId_in: [] } })
        );

        expect(outcomes.items.map(item => item.source)).toEqual(["picked", "roundRobin"]);
        expect(inWorkflows.items.map(item => item.workflowId)).toEqual(["workflow-2"]);
        expect(noWorkflows.items).toEqual([]);
        expect(noWorkflows.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 0 });
    });
});
