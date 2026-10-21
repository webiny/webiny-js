import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { callLog } from "~tests/__helpers/callLog.js";
import { expectOk, otherReviewer, REVIEW_TEAM_ID, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    AssignmentDecision,
    AssignmentRecord,
    AssignmentRecordValues
} from "~/domain/assignment/types.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import type { ReviewStepReachedEvent } from "~/features/review/events.js";

const RECORD_WRITE_FAILED =
    "Could not write an assignment record; the review was saved without it.";

/** A skip, then the rule outcome: what a routing resolver hands back (R117). */
const RULE_RECORDS: AssignmentDecision[] = [
    {
        kind: "skip",
        userId: otherReviewer.id,
        source: "picked",
        ruleId: null,
        by: null,
        reason: "Excluded from reviews."
    },
    {
        kind: "outcome",
        userId: reviewer.id,
        source: "rule",
        ruleId: "rule-legal",
        by: null,
        reason: null
    }
];

const resolverCalls: StepAssignmentResolver.Params[] = [];

class RuleResolverImpl implements StepAssignmentResolver.Interface {
    async resolve(
        params: StepAssignmentResolver.Params
    ): Promise<StepAssignmentResolver.Resolution> {
        resolverCalls.push(params);
        return {
            owner: reviewer,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "rule", ruleId: "rule-legal" },
            records: structuredClone(RULE_RECORDS)
        };
    }
}

const RuleResolver = StepAssignmentResolver.createImplementation({
    implementation: RuleResolverImpl,
    dependencies: []
});

type WriteFault = "none" | "fail" | "throw";

interface WriteFaults {
    mode: WriteFault;
    attempts: number;
}

const writeFaults: WriteFaults = { mode: "none", attempts: 0 };

class FaultyAssignmentWritesImpl implements AssignmentRepository.Interface {
    public constructor(private decoratee: AssignmentRepository.Interface) {}

    public async create(
        values: AssignmentRecordValues
    ): ReturnType<AssignmentRepository.Interface["create"]> {
        writeFaults.attempts++;
        callLog.push("record");
        if (writeFaults.mode === "fail") {
            return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
        }
        if (writeFaults.mode === "throw") {
            throw new Error("Storage crashed.");
        }
        return this.decoratee.create(values);
    }

    public list(
        params: AssignmentRepository.ListParams
    ): ReturnType<AssignmentRepository.Interface["list"]> {
        return this.decoratee.list(params);
    }

    public delete(id: string): ReturnType<AssignmentRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

const FaultyAssignmentWrites = AssignmentRepository.createDecorator({
    decorator: FaultyAssignmentWritesImpl,
    dependencies: []
});

interface SaveFaults {
    failNext: boolean;
}

const saveFaults: SaveFaults = { failNext: false };

/** Fails the next `save` while `saveFaults.failNext` is set; everything else passes through. */
class FailingReviewSaveImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public getActiveByTarget(
        params: ReviewRepository.ActiveByTargetParams
    ): ReturnType<ReviewRepository.Interface["getActiveByTarget"]> {
        return this.decoratee.getActiveByTarget(params);
    }

    public countInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["countInProgressByWorkflow"]> {
        return this.decoratee.countInProgressByWorkflow(workflowId);
    }

    public listInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["listInProgressByWorkflow"]> {
        return this.decoratee.listInProgressByWorkflow(workflowId);
    }

    public listByTarget(
        params: ReviewRepository.ByTargetParams
    ): ReturnType<ReviewRepository.Interface["listByTarget"]> {
        return this.decoratee.listByTarget(params);
    }

    public list(
        params: ReviewRepository.ListParams
    ): ReturnType<ReviewRepository.Interface["list"]> {
        return this.decoratee.list(params);
    }

    public listInReviewByOwners(
        ownerIds: string[]
    ): ReturnType<ReviewRepository.Interface["listInReviewByOwners"]> {
        return this.decoratee.listInReviewByOwners(ownerIds);
    }

    public async save(review: ReviewData): ReturnType<ReviewRepository.Interface["save"]> {
        if (saveFaults.failNext) {
            saveFaults.failNext = false;
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.save(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

const FailingReviewSave = ReviewRepository.createDecorator({
    decorator: FailingReviewSaveImpl,
    dependencies: []
});

interface RecordsContextOptions {
    ruleResolver?: boolean;
}

const createRecordsContext = async (options: RecordsContextOptions = {}) => {
    const { context } = await createReviewContext({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FaultyAssignmentWrites);
            container.registerDecorator(FailingReviewSave);
            if (options.ruleResolver) {
                container.register(RuleResolver);
            }
        }
    });
    const listRecords = async (reviewId: string): Promise<AssignmentRecord[]> => {
        const listed = await context.container
            .resolve(AssignmentRepository)
            .list({ where: { reviewId } });
        return expectOk(listed).items;
    };
    return {
        context,
        listRecords,
        requestReview: context.container.resolve(RequestReviewUseCase)
    };
};

const byKind = (a: AssignmentRecord, b: AssignmentRecord): number => {
    return a.kind.localeCompare(b.kind);
};

describe("Assignment records after save (R117, R118)", () => {
    beforeEach(() => {
        resolverCalls.length = 0;
        loggedErrors.length = 0;
        writeFaults.mode = "none";
        writeFaults.attempts = 0;
        saveFaults.failNext = false;
    });

    it("writes no records when the review save fails", async () => {
        const { requestReview } = await createRecordsContext({ ruleResolver: true });
        saveFaults.failNext = true;

        const result = await requestReview.execute(createRequestInput());

        expect(result.isFail()).toBe(true);
        expect(resolverCalls).toHaveLength(1);
        expect(writeFaults.attempts).toBe(0);
        expect(callLog.filter(entry => !entry.startsWith("event:Cms/"))).toEqual([]);
    });

    it("writes the records before the target sync and the events", async () => {
        const { requestReview } = await createRecordsContext({ ruleResolver: true });

        expectOk(await requestReview.execute(createRequestInput()));

        // The CMS storage publishes its own entry events; only the workflow calls matter here.
        expect(callLog.filter(entry => !entry.startsWith("event:Cms/"))).toEqual([
            "record",
            "record",
            "sync",
            "event:Workflows/Review/Requested",
            "event:Workflows/Review/StepReached"
        ]);
    });

    it("writes the pool outcome of the reached step after the request is saved", async () => {
        const { requestReview, listRecords } = await createRecordsContext();

        const review = expectOk(await requestReview.execute(createRequestInput()));

        expect(await listRecords(review.id)).toEqual([
            {
                id: expect.any(String),
                reviewId: review.id,
                workflowId: review.workflowId,
                stepId: "legal",
                userId: null,
                assignedOn: review.steps[0].reachedOn,
                source: "pool",
                ruleId: null,
                by: null,
                reason: null,
                kind: "outcome"
            }
        ]);
    });

    it("hands the reach time to the resolver and writes its skips and outcome", async () => {
        const { requestReview, listRecords } = await createRecordsContext({ ruleResolver: true });

        const review = expectOk(await requestReview.execute(createRequestInput()));

        expect(resolverCalls).toHaveLength(1);
        expect(resolverCalls[0].now).toBeInstanceOf(Date);
        expect(resolverCalls[0].now.toISOString()).toBe(review.steps[0].reachedOn);
        expect(review.steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            assignment: { source: "rule", ruleId: "rule-legal" }
        });
        const records = [...(await listRecords(review.id))].sort(byKind);
        expect(records).toMatchObject([
            {
                ...RULE_RECORDS[1],
                reviewId: review.id,
                stepId: "legal",
                assignedOn: review.steps[0].reachedOn
            },
            {
                ...RULE_RECORDS[0],
                reviewId: review.id,
                stepId: "legal",
                assignedOn: review.steps[0].reachedOn
            }
        ]);
        const reached = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepReached"
        ) as ReviewStepReachedEvent;
        expect(reached.payload.fact.records).toEqual(RULE_RECORDS);
    });

    it("writes a poolStart outcome on start and a takeOver outcome with by on take over (A49)", async () => {
        const { context, requestReview, listRecords } = await createRecordsContext();
        const requested = expectOk(await requestReview.execute(createRequestInput()));
        const actorInput = {
            reviewId: requested.id,
            stepId: "legal",
            actorTeamIds: [REVIEW_TEAM_ID]
        };

        const started = expectOk(
            await context.container
                .resolve(StartReviewStepUseCase)
                .execute({ ...actorInput, actor: reviewer })
        );
        const takenOver = expectOk(
            await context.container
                .resolve(TakeOverReviewStepUseCase)
                .execute({ ...actorInput, actor: otherReviewer })
        );

        const records = await listRecords(requested.id);
        const bySource = new Map(records.map(record => [record.source, record]));
        expect(records).toHaveLength(3);
        expect(bySource.get("pool")).toMatchObject({
            kind: "outcome",
            userId: null,
            by: null,
            assignedOn: requested.steps[0].reachedOn
        });
        expect(bySource.get("poolStart")).toMatchObject({
            kind: "outcome",
            stepId: "legal",
            userId: reviewer.id,
            ruleId: null,
            by: null,
            reason: null,
            assignedOn: started.steps[0].startedOn
        });
        expect(bySource.get("takeOver")).toMatchObject({
            kind: "outcome",
            stepId: "legal",
            userId: otherReviewer.id,
            by: otherReviewer,
            assignedOn: takenOver.lastChangedOn
        });
    });

    it.each(["fail", "throw"] as const)(
        "keeps the review when writing the assignment log fails (%s)",
        async mode => {
            const { context, requestReview, listRecords } = await createRecordsContext();
            writeFaults.mode = mode;

            const result = await requestReview.execute(createRequestInput());

            expect(result.isOk()).toBe(true);
            expect(writeFaults.attempts).toBe(1);
            expect(loggedErrors.filter(item => item.message === RECORD_WRITE_FAILED)).toEqual([
                {
                    message: RECORD_WRITE_FAILED,
                    fields: expect.objectContaining({
                        reviewId: result.value.id,
                        stepId: "legal",
                        source: "pool"
                    })
                }
            ]);
            const stored = expectOk(
                await context.container.resolve(GetReviewUseCase).execute({ id: result.value.id })
            );
            expect(stored.steps[0].state).toBe("awaiting");
            expect(workflowEventTypes()).toEqual([
                "Workflows/Review/Requested",
                "Workflows/Review/StepReached"
            ]);
            writeFaults.mode = "none";
            expect(await listRecords(result.value.id)).toEqual([]);
        }
    );
});
