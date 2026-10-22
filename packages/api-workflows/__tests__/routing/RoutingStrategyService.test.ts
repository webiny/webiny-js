import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, createWorkflowValues, expectOk } from "~tests/__helpers/fixtures.js";
import { assignmentRecord, inReviewData } from "~tests/__helpers/routingSeeds.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import type { RoutingStrategyName, RoutingUser } from "~/domain/routing/types.js";
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/index.js";

const ANNA = { id: "user-anna", displayName: "Anna" };
const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };
const CANDIDATES: RoutingUser[] = [ANNA, BOB, CARA];

/** Every `AssignmentRepository.list` call, in order. Reset per context. */
const assignmentListCalls: AssignmentRepository.ListParams[] = [];

class RecordingAssignmentListImpl implements AssignmentRepository.Interface {
    public constructor(private decoratee: AssignmentRepository.Interface) {}

    public create(
        values: Parameters<AssignmentRepository.Interface["create"]>[0]
    ): ReturnType<AssignmentRepository.Interface["create"]> {
        return this.decoratee.create(values);
    }

    public list(
        params: AssignmentRepository.ListParams
    ): ReturnType<AssignmentRepository.Interface["list"]> {
        assignmentListCalls.push(structuredClone(params));
        return this.decoratee.list(params);
    }

    public deleteMany(ids: string[]): ReturnType<AssignmentRepository.Interface["deleteMany"]> {
        return this.decoratee.deleteMany(ids);
    }
}

/**
 * An outcome history without end: every page holds 100 records of Anna and Bob and has a next
 * page, so a tied Cara is never found. Records every `list` call like the recording decorator.
 */
class EndlessAnnaBobHistoryImpl extends RecordingAssignmentListImpl {
    public override async list(
        params: AssignmentRepository.ListParams
    ): ReturnType<AssignmentRepository.Interface["list"]> {
        assignmentListCalls.push(structuredClone(params));
        const page = params.after ? Number(params.after) : 0;
        const items = Array.from({ length: 100 }, (_, index) => ({
            ...assignmentRecord({
                userId: index % 2 === 0 ? ANNA.id : BOB.id,
                source: "leastLoaded",
                // Newest first: Anna's first record is newer than Bob's.
                assignedOn: new Date(
                    Date.UTC(2026, 9, 9) - (page * 100 + index) * 1000
                ).toISOString()
            }),
            id: `record-${page}-${index}`
        }));
        return Result.ok({
            items,
            meta: {
                cursor: String(page + 1),
                hasMoreItems: true,
                totalCount: Number.MAX_SAFE_INTEGER
            }
        });
    }
}

const createStrategyContext = async (
    decorator: typeof RecordingAssignmentListImpl = RecordingAssignmentListImpl
) => {
    assignmentListCalls.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(
                AssignmentRepository.createDecorator({
                    decorator,
                    dependencies: []
                })
            );
        }
    });
    const strategies = context.container.resolve(RoutingStrategyService);
    const order = async (
        strategy: RoutingStrategyName,
        model = ARTICLE_MODEL,
        workflowId: string | null = "workflow-1",
        reviewId: string | null = "review-routed"
    ): Promise<string[]> => {
        const ordered = await strategies.order({
            strategy,
            candidates: CANDIDATES,
            model,
            workflowId,
            reviewId,
            stepId: "legal"
        });
        return expectOk(ordered).map(user => user.id);
    };
    return {
        order,
        assignments: context.container.resolve(AssignmentRepository),
        reviews: context.container.resolve(ReviewRepository),
        workflows: context.container.resolve(WorkflowRepository)
    };
};

describe("RoutingStrategyService: round robin (R115)", () => {
    it("starts with the first candidate without history or without a stored workflow", async () => {
        const { order } = await createStrategyContext();

        expect(await order("roundRobin")).toEqual([ANNA.id, BOB.id, CARA.id]);
        expect(await order("roundRobin", ARTICLE_MODEL, null)).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("asks the candidate after the latest assignee of the workflow step first", async () => {
        const { order, assignments } = await createStrategyContext();
        const seeds = [
            assignmentRecord({ userId: BOB.id, source: "roundRobin" }),
            // Newer, but not an assignee: a skip and a pool outcome.
            assignmentRecord({
                userId: CARA.id,
                source: "roundRobin",
                kind: "skip",
                reason: "Cannot read this content.",
                assignedOn: "2026-10-09T11:00:00.000Z"
            }),
            assignmentRecord({ assignedOn: "2026-10-09T12:00:00.000Z" }),
            // Newer, but another step and another workflow.
            assignmentRecord({
                userId: ANNA.id,
                stepId: "editorial",
                source: "roundRobin",
                assignedOn: "2026-10-09T13:00:00.000Z"
            }),
            assignmentRecord({
                userId: CARA.id,
                workflowId: "workflow-2",
                source: "roundRobin",
                assignedOn: "2026-10-09T14:00:00.000Z"
            })
        ];
        for (const seed of seeds) {
            expectOk(await assignments.create(seed));
        }

        expect(await order("roundRobin")).toEqual([CARA.id, ANNA.id, BOB.id]);
    });

    it("finds the latest assignee behind more than a page of pool outcomes", async () => {
        const { order, assignments } = await createStrategyContext();
        expectOk(
            await assignments.create(
                assignmentRecord({
                    userId: ANNA.id,
                    source: "roundRobin",
                    assignedOn: "2026-10-09T09:00:00.000Z"
                })
            )
        );
        for (let index = 0; index < 101; index++) {
            const second = String(index % 60).padStart(2, "0");
            const minute = String(Math.floor(index / 60)).padStart(2, "0");
            expectOk(
                await assignments.create(
                    assignmentRecord({ assignedOn: `2026-10-09T10:${minute}:${second}.000Z` })
                )
            );
        }
        assignmentListCalls.length = 0;

        expect(await order("roundRobin")).toEqual([BOB.id, CARA.id, ANNA.id]);
        expect(assignmentListCalls.length).toBeGreaterThan(1);
    });

    it("counts take over outcomes and keeps the position of a former candidate", async () => {
        const { order, assignments } = await createStrategyContext();
        expectOk(
            await assignments.create(assignmentRecord({ userId: CARA.id, source: "poolStart" }))
        );
        expectOk(
            await assignments.create(
                assignmentRecord({
                    userId: "user-bea",
                    source: "takeOver",
                    by: { type: "user", id: "user-bea", displayName: "Bea" },
                    assignedOn: "2026-10-09T11:00:00.000Z"
                })
            )
        );

        expect(await order("roundRobin")).toEqual([BOB.id, CARA.id, ANNA.id]);
    });

    it("wraps around after the last candidate", async () => {
        const { order, assignments } = await createStrategyContext();
        expectOk(
            await assignments.create(assignmentRecord({ userId: CARA.id, source: "reassign" }))
        );

        expect(await order("roundRobin")).toEqual([ANNA.id, BOB.id, CARA.id]);
    });
});

describe("RoutingStrategyService: least loaded (R115, D137)", () => {
    it("orders by in-review load counted per app", async () => {
        const { order, reviews } = await createStrategyContext();
        const seeds = [
            inReviewData("review-a1", ANNA.id, "cms.article"),
            inReviewData("review-a2", ANNA.id, "cms.blog"),
            inReviewData("review-b1", BOB.id, "cms.article"),
            inReviewData("review-b2", BOB.id, "wb.page"),
            inReviewData("review-b3", BOB.id, "wb.page"),
            inReviewData("review-b4", BOB.id, "wb.page"),
            // Not load: an inactive review.
            { ...inReviewData("review-c1", CARA.id, "cms.article"), isActive: false }
        ];
        for (const seed of seeds) {
            expectOk(await reviews.create(seed));
        }

        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, BOB.id, ANNA.id]);
        // Website Builder: Anna and Cara have none and were never assigned, so id order.
        expect(await order("leastLoaded", "wb.page")).toEqual([ANNA.id, CARA.id, BOB.id]);
    });

    it("breaks ties by the least recent assignment in the same app's workflows", async () => {
        const { order, assignments, workflows } = await createStrategyContext();
        expectOk(await workflows.create(createWorkflowValues({ id: "workflow-1" })));
        expectOk(
            await workflows.create(
                createWorkflowValues({ id: "workflow-blog", name: "Blog", models: ["cms.blog"] })
            )
        );
        expectOk(
            await workflows.create(
                createWorkflowValues({ id: "workflow-wb", name: "Pages", models: ["wb.page"] })
            )
        );
        const seeds = [
            assignmentRecord({
                userId: ANNA.id,
                source: "leastLoaded",
                assignedOn: "2026-10-09T08:00:00.000Z"
            }),
            assignmentRecord({
                userId: ANNA.id,
                source: "leastLoaded",
                assignedOn: "2026-10-09T11:00:00.000Z"
            }),
            assignmentRecord({
                userId: BOB.id,
                workflowId: "workflow-blog",
                source: "picked",
                assignedOn: "2026-10-09T10:00:00.000Z"
            }),
            // Ignored: another app's workflow, and a skip.
            assignmentRecord({
                userId: CARA.id,
                workflowId: "workflow-wb",
                source: "picked",
                assignedOn: "2026-10-09T12:00:00.000Z"
            }),
            assignmentRecord({
                userId: CARA.id,
                source: "leastLoaded",
                kind: "skip",
                reason: "Cannot read this content.",
                assignedOn: "2026-10-09T13:00:00.000Z"
            })
        ];
        for (const seed of seeds) {
            expectOk(await assignments.create(seed));
        }

        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, BOB.id, ANNA.id]);
    });

    it("does not count the review being routed as load", async () => {
        const { order, reviews } = await createStrategyContext();
        // Anna owns only the routed review (its previous step); Bob owns another one.
        expectOk(await reviews.create(inReviewData("review-routed", ANNA.id, "cms.article")));
        expectOk(await reviews.create(inReviewData("review-b1", BOB.id, "cms.article")));

        expect(await order("leastLoaded", "cms.article")).toEqual([ANNA.id, CARA.id, BOB.id]);
        expect(await order("leastLoaded", "cms.article", "workflow-1", null)).toEqual([
            CARA.id,
            ANNA.id,
            BOB.id
        ]);
    });

    it("reads the latest outcomes of the candidates tied at the lowest load only, with one list", async () => {
        const { order, assignments, reviews, workflows } = await createStrategyContext();
        expectOk(await workflows.create(createWorkflowValues({ id: "workflow-1" })));
        expectOk(await reviews.create(inReviewData("review-c1", CARA.id, "cms.article")));
        const seeds = [
            assignmentRecord({
                userId: ANNA.id,
                source: "leastLoaded",
                assignedOn: "2026-10-09T08:00:00.000Z"
            }),
            assignmentRecord({
                userId: ANNA.id,
                source: "leastLoaded",
                assignedOn: "2026-10-09T11:00:00.000Z"
            })
        ];
        for (const seed of seeds) {
            expectOk(await assignments.create(seed));
        }
        assignmentListCalls.length = 0;

        // Bob was never assigned, so he goes before Anna; Cara has load.
        expect(await order("leastLoaded", "cms.article")).toEqual([BOB.id, ANNA.id, CARA.id]);
        expect(assignmentListCalls).toEqual([
            {
                where: {
                    userId_in: [ANNA.id, BOB.id],
                    workflowId_in: ["workflow-1"],
                    kind: "outcome"
                },
                after: null
            }
        ]);
    });

    it("lists the history of any number of tied candidates once", async () => {
        const { order, assignments, workflows } = await createStrategyContext();
        expectOk(await workflows.create(createWorkflowValues({ id: "workflow-1" })));
        // Each candidate several times; Bob least recently, then Cara, then Anna.
        const latestHour: Record<string, number> = { [ANNA.id]: 15, [BOB.id]: 11, [CARA.id]: 13 };
        for (const candidate of CANDIDATES) {
            for (let hour = 8; hour <= latestHour[candidate.id]; hour++) {
                expectOk(
                    await assignments.create(
                        assignmentRecord({
                            userId: candidate.id,
                            source: "leastLoaded",
                            assignedOn: `2026-10-09T${String(hour).padStart(2, "0")}:00:00.000Z`
                        })
                    )
                );
            }
        }
        assignmentListCalls.length = 0;

        expect(await order("leastLoaded", "cms.article")).toEqual([BOB.id, CARA.id, ANNA.id]);
        expect(assignmentListCalls).toHaveLength(1);
    });

    it("pages through the history until every tied candidate is found", async () => {
        const { order, assignments, workflows } = await createStrategyContext();
        expectOk(await workflows.create(createWorkflowValues({ id: "workflow-1" })));
        // Cara's only outcome is behind more than a page of Anna's and Bob's.
        expectOk(
            await assignments.create(
                assignmentRecord({
                    userId: CARA.id,
                    source: "leastLoaded",
                    assignedOn: "2026-10-09T07:00:00.000Z"
                })
            )
        );
        for (let index = 0; index < 101; index++) {
            const second = String(index % 60).padStart(2, "0");
            const minute = String(Math.floor(index / 60)).padStart(2, "0");
            const userId = index % 2 === 0 ? ANNA.id : BOB.id;
            expectOk(
                await assignments.create(
                    assignmentRecord({
                        userId,
                        source: "leastLoaded",
                        assignedOn: `2026-10-09T10:${minute}:${second}.000Z`
                    })
                )
            );
        }
        assignmentListCalls.length = 0;

        // Anna's latest (index 100) is newer than Bob's (index 99).
        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, BOB.id, ANNA.id]);
        expect(assignmentListCalls).toHaveLength(2);
    });

    it("stops reading the history after five pages and counts an unfound candidate as never assigned", async () => {
        const { order, workflows } = await createStrategyContext(EndlessAnnaBobHistoryImpl);
        expectOk(await workflows.create(createWorkflowValues({ id: "workflow-1" })));

        // Cara has no record within the pages read, so she goes first; Bob's latest is older.
        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, BOB.id, ANNA.id]);
        expect(assignmentListCalls.map(call => call.after)).toEqual([null, "1", "2", "3", "4"]);
    });

    it("reads no history when one candidate has the lowest load", async () => {
        const { order, reviews } = await createStrategyContext();
        expectOk(await reviews.create(inReviewData("review-a1", ANNA.id, "cms.article")));
        expectOk(await reviews.create(inReviewData("review-b1", BOB.id, "cms.article")));

        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, ANNA.id, BOB.id]);
        expect(assignmentListCalls).toEqual([]);
    });
});
