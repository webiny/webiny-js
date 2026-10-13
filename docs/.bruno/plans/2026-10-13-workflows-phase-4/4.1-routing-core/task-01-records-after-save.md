### Task 1: Resolver `now`, resolution records, records written after save, start and take over records

Spec 4.3, 6, D20, D45, D89, D127, R109, R117, R118, A49. Every assignment decision becomes a record in the assignment log, written only after the review is saved, so a failed save leaves no orphaned records:

- R109: one closed set of sources, `AssignmentSource = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool" | "poolStart" | "takeOver" | "reassign"`, on `ReviewStepAssignment.source`, `ReviewStep.assignmentSource` and `AssignmentRecordValues.source`. The rule that decided goes into `ruleId`: the assignment record model gains a `ruleId` text field (unreleased model) and the GraphQL `WorkflowsAssignmentEntry` gains `ruleId: String`. Comments that list "rule id" or "strategy" as a source are updated. Existing tests that used `"strategy"` or a rule id as the source now use `"roundRobin"`, or `"rule"` with `ruleId`.
- `AssignmentDecision` is one record without the review, step and time: `{ kind, userId, source, ruleId, by, reason }`. `AssignmentRecordValues` is an `AssignmentDecision` plus `reviewId`, `workflowId`, `stepId` and `assignedOn`.
- R117: `StepAssignmentResolution` gains `records: AssignmentDecision[]`, in decision order (skips first, then the outcome). `Review.reach` puts them on the `stepReached` fact. When the aggregate demotes a requester owner to the pool, the resolver's skips stay and its outcome is replaced by a pool outcome with the requester reason. `Review.start` puts `{ source: "poolStart" }` and `Review.takeOver` puts `{ source: "takeOver", by: actor }` outcome records on their facts (A49).
- The pure `toAssignmentRecordValues(review, fact)` turns a saved fact into record values: `assignedOn` is the fact's `occurredOn`, which is the reach `now`. It switches over every fact type, so a new fact (4.2 adds `stepReassigned`) fails to compile until it gets a case.
- `ReviewSaver` writes the records of every fact right after the repository save and before the target sync (`AssignmentRepository.create`, one per record). A failed result or a throw is logged through `Logger` with `"Could not write an assignment record; the review was saved without it."`. It never fails the save.
- R118: `StepAssignmentResolverParams` gains `now: Date`, and `ReviewStepReacher` passes `new Date(params.now)`. `PoolStepAssignmentResolver` (replaced in Task 3) returns one pool outcome record.
- App test helpers that seed exact assignment logs first remove the record the request now writes. The CMS test that expected an empty log now expects that pool outcome.

**Files:**
- Modify: `packages/api-workflows/src/domain/assignment/types.ts`
- Modify: `packages/api-workflows/src/domain/assignment/assignment.model.ts`
- Create: `packages/api-workflows/src/domain/assignment/toAssignmentRecordValues.ts`
- Modify: `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/src/domain/review/facts.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Modify: `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Create: `packages/api-workflows/__tests__/__helpers/CapturingLogger.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.request.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.checks.test.ts`
- Modify: `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`
- Modify: `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`
- Modify: `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`
- Modify: `packages/api-workflows/__tests__/assignment/ListReviewAssignments.test.ts`
- Modify: `packages/api-workflows/__tests__/assignment/redactAssignmentRecords.test.ts`
- Modify: `packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Test: `packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts`
- Test: `packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/__helpers/assignments.ts`

**Interfaces:**
- Consumes: `AssignmentRepository.create(values): Promise<Result<AssignmentRecord, AssignmentPersistenceError>>`, `AssignmentRepository.list({ where: { reviewId } })`, `Logger` (`@webiny/api-core/features/logger/index.js`, `error(fields, message)`), `ReviewFact` union (`domain/review/facts.ts`), `StepAssignmentResolver.Params` / `.Resolution`, `ReviewStepReacher.Params { review, actor, now: string }`.
- Produces (Tasks 2, 3 and 4.2 use these names exactly):
  - In `domain/assignment/types.ts`: `type AssignmentSource = "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool" | "poolStart" | "takeOver" | "reassign"`; `interface AssignmentDecision { kind: AssignmentRecordKind; userId: string | null; source: AssignmentSource; ruleId: string | null; by: Actor | null; reason: string | null }`; `interface AssignmentRecordValues extends AssignmentDecision { reviewId: string; workflowId: string; stepId: string; assignedOn: string }` (so `AssignmentRecord.ruleId: string | null`).
  - `ReviewStepAssignment.source: AssignmentSource`; `ReviewStep.assignmentSource: AssignmentSource | null`; `StepAssignmentResolution.records: AssignmentDecision[]`.
  - `ReviewStepReachedFact.records`, `ReviewStepStartedFact.records`, `ReviewStepTakenOverFact.records`: `AssignmentDecision[]`.
  - `toAssignmentRecordValues(review: ReviewData, fact: ReviewFact): AssignmentRecordValues[]` (`domain/assignment/toAssignmentRecordValues.js`). 4.2 Task 4 adds a `stepReassigned` case.
  - `StepAssignmentResolverParams.now: Date`.
  - GraphQL `WorkflowsAssignmentEntry.ruleId: String` (after `source`).
  - Test helpers: `poolOutcomeRecord(): AssignmentDecision` (`__tests__/__helpers/fixtures.ts`); `captureLoggedErrors(container)`, `loggedErrors: LoggedError[]` (`__tests__/__helpers/CapturingLogger.ts`).

- [ ] **Step 1: Write the helpers and the failing tests**

In `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`, in `round-trips every field, including nullables, owners and assignments`, replace `assignmentSource: "rule",` with `assignmentSource: "rule" as const,` and `source: "rule",` with `source: "rule" as const,`. The narrowed `AssignmentSource` (R109) would otherwise reject the widened `string` literals in `repository.save(data)` and fail `check:test:types`.

Create `packages/api-workflows/__tests__/__helpers/CapturingLogger.ts`:

```ts
import type { Container } from "@webiny/di";
import { Logger } from "@webiny/api-core/features/logger/index.js";

export interface LoggedError {
    message: string;
    fields: Record<string, unknown>;
}

/** Errors logged through `Logger` while `captureLoggedErrors` is registered. Clear it per test. */
export const loggedErrors: LoggedError[] = [];

class CapturingLogger implements Logger.Interface {
    public constructor(private decoratee: Logger.Interface) {}

    public trace(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.trace(objOrMsg, ...args);
    }
    public debug(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.debug(objOrMsg, ...args);
    }
    public info(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.info(objOrMsg, ...args);
    }
    public warn(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.warn(objOrMsg, ...args);
    }
    public error(objOrMsg: object | string, ...args: any[]): void {
        if (typeof objOrMsg === "string") {
            loggedErrors.push({ message: objOrMsg, fields: {} });
            return;
        }
        loggedErrors.push({ message: String(args[0]), fields: { ...objOrMsg } });
    }
    public fatal(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.fatal(objOrMsg, ...args);
    }
    public log(objOrMsg: object | string, ...args: any[]): void {
        this.decoratee.log(objOrMsg, ...args);
    }
}

/** Captures logged errors into `loggedErrors` instead of printing them. Call it in `setup`. */
export const captureLoggedErrors = (container: Container) => {
    container.registerDecorator(
        Logger.createDecorator({ decorator: CapturingLogger, dependencies: [] })
    );
};
```

In `packages/api-workflows/__tests__/__helpers/fixtures.ts`, add to the imports:

```ts
import type { AssignmentDecision } from "~/domain/assignment/types.js";
```

and replace:

```ts
export const poolResolution = (): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [REVIEW_TEAM_ID],
        assignment: { source: "pool" }
    };
};
```

with:

```ts
/** The outcome record of a step that went to the pool without a reason. */
export const poolOutcomeRecord = (): AssignmentDecision => {
    return { kind: "outcome", userId: null, source: "pool", ruleId: null, by: null, reason: null };
};

export const poolResolution = (): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [REVIEW_TEAM_ID],
        assignment: { source: "pool" },
        records: [poolOutcomeRecord()]
    };
};
```

Create `packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    createRequestedReview,
    NOW,
    otherReviewer,
    requester,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import { toAssignmentRecordValues } from "~/domain/assignment/toAssignmentRecordValues.js";

const LATER = "2026-10-09T11:00:00.000Z";

const SKIP: AssignmentDecision = {
    kind: "skip",
    userId: otherReviewer.id,
    source: "rule",
    ruleId: "rule-legal",
    by: null,
    reason: "Excluded from reviews."
};

const OUTCOME: AssignmentDecision = {
    kind: "outcome",
    userId: reviewer.id,
    source: "roundRobin",
    ruleId: null,
    by: null,
    reason: null
};

describe("toAssignmentRecordValues (R117)", () => {
    it("turns the records of a reached step into values of that review, step and time", () => {
        const review = toSaveData(createRequestedReview());
        const fact: ReviewFact = {
            type: "stepReached",
            occurredOn: LATER,
            actor: requester,
            owner: reviewer,
            change: { stepId: "editorial", fromState: "pending", toState: "inReview" },
            assignment: { source: "roundRobin" },
            records: [SKIP, OUTCOME]
        };

        const values = toAssignmentRecordValues(review, fact);

        expect(values).toEqual([
            {
                ...SKIP,
                reviewId: "review-1",
                workflowId: "workflow-1",
                stepId: "editorial",
                assignedOn: LATER
            },
            {
                ...OUTCOME,
                reviewId: "review-1",
                workflowId: "workflow-1",
                stepId: "editorial",
                assignedOn: LATER
            }
        ]);
    });

    it("turns start and take over into one outcome each", () => {
        const review = toSaveData(createRequestedReview());
        const started: ReviewFact = {
            type: "stepStarted",
            occurredOn: NOW,
            actor: reviewer,
            change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
            records: [{ ...OUTCOME, source: "poolStart" }]
        };
        const takenOver: ReviewFact = {
            type: "stepTakenOver",
            occurredOn: LATER,
            actor: otherReviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
            previousOwner: reviewer,
            records: [{ ...OUTCOME, userId: otherReviewer.id, source: "takeOver", by: otherReviewer }]
        };

        expect(toAssignmentRecordValues(review, started)).toMatchObject([
            { source: "poolStart", userId: reviewer.id, stepId: "legal", assignedOn: NOW }
        ]);
        expect(toAssignmentRecordValues(review, takenOver)).toMatchObject([
            { source: "takeOver", userId: otherReviewer.id, by: otherReviewer, assignedOn: LATER }
        ]);
    });

    it("returns nothing for facts without assignment decisions", () => {
        const review = toSaveData(createRequestedReview());
        const facts: ReviewFact[] = [
            { type: "requested", occurredOn: NOW, actor: requester },
            {
                type: "stepApproved",
                occurredOn: NOW,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "approved" },
                comment: null
            },
            {
                type: "cancelled",
                occurredOn: NOW,
                actor: requester,
                stepId: "legal",
                stepState: "awaiting",
                reason: null
            },
            { type: "approved", occurredOn: NOW, actor: reviewer }
        ];

        expect(facts.flatMap(fact => toAssignmentRecordValues(review, fact))).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { expectOk, otherReviewer, REVIEW_TEAM_ID, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
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

const RECORD_WRITE_FAILED = "Could not write an assignment record; the review was saved without it.";

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

interface RecordsContextOptions {
    ruleResolver?: boolean;
}

const createRecordsContext = async (options: RecordsContextOptions = {}) => {
    const { context } = await createReviewContext({
        setup: container => {
            captureLoggedErrors(container);
            container.registerDecorator(FaultyAssignmentWrites);
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
```

In `packages/api-workflows/__tests__/domain/Review.request.test.ts`:

Add `poolOutcomeRecord` to the `~tests/__helpers/fixtures.js` import list (after `otherReviewer`), and add the import:

```ts
import type { AssignmentDecision } from "~/domain/assignment/types.js";
```

After the `onLegal` helper, add:

```ts
const pickedOutcome = (userId: string): AssignmentDecision => {
    return { kind: "outcome", userId, source: "picked", ruleId: null, by: null, reason: null };
};

const EXCLUDED_SKIP: AssignmentDecision = {
    kind: "skip",
    userId: otherReviewer.id,
    source: "rule",
    ruleId: "rule-legal",
    by: null,
    reason: "Excluded from reviews."
};
```

In "puts the step in the pool when nobody owns it", replace:

```ts
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: { source: "pool" }
            }
        ]);
    });

    it("starts the step when an owner resolves", () => {
```

with:

```ts
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: { source: "pool" },
                records: [poolOutcomeRecord()]
            }
        ]);
    });

    it("starts the step when an owner resolves", () => {
```

In "starts the step when an owner resolves", replace:

```ts
                resolution: {
                    owner: reviewer,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" }
                },
```

with:

```ts
                resolution: {
                    owner: reviewer,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" },
                    records: [EXCLUDED_SKIP, pickedOutcome(reviewer.id)]
                },
```

and replace:

```ts
            change: { stepId: "legal", fromState: "pending", toState: "inReview" },
            assignment: { source: "picked" }
        });
    });
```

with:

```ts
            change: { stepId: "legal", fromState: "pending", toState: "inReview" },
            assignment: { source: "picked" },
            records: [EXCLUDED_SKIP, pickedOutcome(reviewer.id)]
        });
    });
```

In "falls back to the pool when the resolved owner is the requester", replace:

```ts
                resolution: {
                    owner: requester,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" }
                },
```

with:

```ts
                resolution: {
                    owner: requester,
                    candidateTeamIds: [REVIEW_TEAM_ID],
                    assignment: { source: "picked" },
                    records: [EXCLUDED_SKIP, pickedOutcome(requester.id)]
                },
```

and replace:

```ts
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: expectedAssignment
            }
        ]);
    });
```

with:

```ts
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: expectedAssignment,
                // The resolver's skips stay; its outcome becomes the pool (R117).
                records: [
                    EXCLUDED_SKIP,
                    {
                        kind: "outcome",
                        userId: null,
                        source: "pool",
                        ruleId: null,
                        by: null,
                        reason: expectedAssignment.reason
                    }
                ]
            }
        ]);
    });
```

In "lets a candidate start an awaiting step", replace:

```ts
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" }
            }
        ]);
```

with:

```ts
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" },
                records: [
                    {
                        kind: "outcome",
                        userId: reviewer.id,
                        source: "poolStart",
                        ruleId: null,
                        by: null,
                        reason: null
                    }
                ]
            }
        ]);
```

In "moves a human step to another candidate", replace:

```ts
                change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
                previousOwner: reviewer
            }
        ]);
```

with:

```ts
                change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
                previousOwner: reviewer,
                records: [
                    {
                        kind: "outcome",
                        userId: otherReviewer.id,
                        source: "takeOver",
                        ruleId: null,
                        by: otherReviewer,
                        reason: null
                    }
                ]
            }
        ]);
```

In "does not take over an AI step", replace:

```ts
                    assignment: { source: "strategy" }
                },
```

with:

```ts
                    assignment: { source: "roundRobin" },
                    records: []
                },
```

In `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`, `packages/api-workflows/__tests__/domain/Review.checks.test.ts` and `packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts`, replace (once per file):

```ts
                assignment: { source: "strategy" }
            },
```

with:

```ts
                assignment: { source: "roundRobin" },
                records: []
            },
```

In `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`, add `poolOutcomeRecord` to the `~tests/__helpers/fixtures.js` import list, then replace:

```ts
            change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
            assignment: { source: "pool" }
        });
    });
```

with:

```ts
            change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
            assignment: { source: "pool" },
            records: [poolOutcomeRecord()]
        });
    });
```

and in "ships no target sync, no target loaders and a pool-only resolver" replace:

```ts
        const resolution = await context.container
            .resolve(StepAssignmentResolver)
            .resolve({ review, step: review.steps[0] });

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" }
        });
```

with:

```ts
        const resolution = await context.container
            .resolve(StepAssignmentResolver)
            .resolve({ review, step: review.steps[0], now: new Date(NOW) });

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" },
            records: [poolOutcomeRecord()]
        });
```

In `packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts`, in `record`, replace:

```ts
        source: "picked",
        by: null,
        reason: null,
        kind: "outcome"
    };
```

with:

```ts
        source: "picked",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome"
    };
```

In `packages/api-workflows/__tests__/assignment/ListReviewAssignments.test.ts`, in `record`, replace:

```ts
        source: "strategy",
        by: null,
```

with:

```ts
        source: "roundRobin",
        ruleId: null,
        by: null,
```

In `packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts`, in `record`, replace:

```ts
        source: "strategy",
        by: null,
```

with:

```ts
        source: "roundRobin",
        ruleId: null,
        by: null,
```

In `packages/api-workflows/__tests__/assignment/redactAssignmentRecords.test.ts`, in `record`, replace:

```ts
        source: kind === "skip" ? "rule-1" : "strategy",
        by: null,
```

with:

```ts
        source: kind === "skip" ? "rule" : "roundRobin",
        ruleId: kind === "skip" ? "rule-1" : null,
        by: null,
```

In `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`:

In `record`, replace:

```ts
        source: "pool",
        by: null,
        reason: null,
        kind: "outcome",
        ...overrides
```

with:

```ts
        source: "pool",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome",
        ...overrides
```

In the first `expect(pool).toEqual({ ... })`, replace:

```ts
            source: "pool",
            by: null,
            reason: "No eligible candidates.",
```

with:

```ts
            source: "pool",
            ruleId: null,
            by: null,
            reason: "No eligible candidates.",
```

In "stores the kind and reads a record stored without it as an outcome (R96)", rename the test to `"stores the kind and the rule id and reads a record stored without them as an outcome without a rule (R96, R109)"`, replace:

```ts
                    source: "rule-1",
                    reason: "Excluded: on leave.",
                    kind: "skip"
```

with:

```ts
                    source: "rule",
                    ruleId: "rule-1",
                    reason: "Excluded from reviews.",
                    kind: "skip"
```

and replace:

```ts
        expect(listed.items.map(item => [item.userId, item.kind])).toEqual([
            [reviewer.id, "skip"],
            [otherReviewer.id, "outcome"]
        ]);
```

with:

```ts
        expect(listed.items.map(item => [item.userId, item.kind, item.ruleId])).toEqual([
            [reviewer.id, "skip", "rule-1"],
            [otherReviewer.id, "outcome", null]
        ]);
```

In `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`, replace:

```ts
            "assignedOn",
            "source",
            "by",
            "reason"
        ]);
```

with:

```ts
            "assignedOn",
            "source",
            "ruleId",
            "by",
            "reason"
        ]);
```

In `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`, replace the JSDoc and the start of `seedAssignmentRecords`:

```ts
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
```

with:

```ts
/**
 * Replaces the log of the only step with two known records: an outcome (the pool) and, a minute
 * later, a skip of the requester. Newest first, the skip comes first. The record the request
 * wrote when the step was reached (R117) is removed first.
 */
export const seedAssignmentRecords = async (
    context: CmsContext,
    review: ReviewData
): Promise<void> => {
    const repository = context.container.resolve(AssignmentRepository);
    const written = expectOk(await repository.list({ where: { reviewId: review.id } }));
    for (const record of written.items) {
        expectOk(await repository.delete(record.id));
    }
    expectOk(
```

and in both `repository.create({ ... })` calls add `ruleId: null,` after the `source` line, with the second call's `source: "strategy",` replaced by `source: "roundRobin",`.

In `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`, in "reads the same review by id and by revision, assignments included", replace:

```ts
                kind: "skip",
                source: "strategy",
```

with:

```ts
                kind: "skip",
                source: "roundRobin",
```

In `packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts`, in "returns the active review of a revision with the viewer's flags", replace:

```ts
        expect(result?.review.steps.map(step => [step.id, step.assignments])).toEqual([
            [STEP_ID, []]
        ]);
```

with:

```ts
        // The request wrote the pool outcome when the step was reached (R117).
        expect(result?.review.steps.map(step => step.id)).toEqual([STEP_ID]);
        expect(result?.review.steps[0].assignments).toMatchObject([
            {
                kind: "outcome",
                source: "pool",
                userId: null,
                ruleId: null,
                reason: null,
                reviewId: review.id
            }
        ]);
```

In `packages/api-website-builder-workflows/__tests__/__helpers/assignments.ts`, replace:

```ts
/**
 * Two assignment-log records of the review's only step, written straight to the repository:
 * nothing writes the log before phase 4 (A44).
 */
export const seedAssignments = async (
    context: CmsContext,
    review: ReviewData
): Promise<SeededAssignments> => {
    const repository = context.container.resolve(AssignmentRepository);
```

with:

```ts
/**
 * Replaces the log of the review's only step with two known records, written straight to the
 * repository. The record the request wrote when the step was reached (R117) is removed first.
 */
export const seedAssignments = async (
    context: CmsContext,
    review: ReviewData
): Promise<SeededAssignments> => {
    const repository = context.container.resolve(AssignmentRepository);
    const written = expectOk(await repository.list({ where: { reviewId: review.id } }));
    for (const record of written.items) {
        expectOk(await repository.delete(record.id));
    }
```

and in both `repository.create({ ... })` calls add `ruleId: null,` after the `source` line.

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. `toAssignmentRecordValues.test.ts` cannot resolve `~/domain/assignment/toAssignmentRecordValues.js`; `AssignmentRecordsAfterSave.test.ts` finds no records (`[]`) and `resolverCalls[0].now` undefined; `Review.request.test.ts` facts lack `records`; the repository test reads `ruleId` as `undefined`; the schema test misses `ruleId`.

- [ ] **Step 3: Sources, decisions and the record values**

Replace the whole `packages/api-workflows/src/domain/assignment/types.ts` with:

```ts
import type { Actor, ReviewData, ReviewStep, ReviewViewerFlags } from "~/domain/review/types.js";

/**
 * `outcome`: who got the step (pick, rule, strategy, pool, start, take over, reassign). `skip`: a
 * person passed over, with the reason (requester, excluded, not a member, cannot read); only
 * viewers with `editor` or `reassign` see these (D89, D127).
 */
export type AssignmentRecordKind = "outcome" | "skip";

/**
 * Why a step has its owner (R109). `rule`: a rule's user target; a rule's team target leaves the
 * strategy name or `pool` with the rule in `ruleId`. `poolStart`, `takeOver` and `reassign` are
 * the transitions that change the owner after the step was reached.
 */
export type AssignmentSource =
    | "picked"
    | "rule"
    | "roundRobin"
    | "leastLoaded"
    | "pool"
    | "poolStart"
    | "takeOver"
    | "reassign";

/**
 * One assignment decision, before it is tied to a saved review (R117): the resolver and the
 * transitions produce these, `ReviewSaver` writes them after the save.
 */
export interface AssignmentDecision {
    kind: AssignmentRecordKind;
    /** The owner (outcome) or the person passed over (skip); `null` for the pool. */
    userId: string | null;
    source: AssignmentSource;
    /** The rule that decided or was skipped; `null` otherwise. */
    ruleId: string | null;
    /** Who acted, for take over and reassign. */
    by: Actor | null;
    /**
     * A fixed text for skips and pool fall-through (R112, R116). Never an exclusion's own reason
     * (D89, D97).
     */
    reason: string | null;
}

/** One assignment-log record (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues extends AssignmentDecision {
    reviewId: string;
    workflowId: string;
    stepId: string;
    assignedOn: string;
}

export interface AssignmentRecord extends AssignmentRecordValues {
    id: string;
}

/** A review step with its assignment-log entries, newest first (D127). */
export interface ReviewStepWithAssignments extends ReviewStep {
    assignments: AssignmentRecord[];
}

/** A review as the get-review wrappers return it: each step carries its entries (R96). */
export interface ReviewWithAssignments extends Omit<ReviewData, "steps"> {
    steps: ReviewStepWithAssignments[];
}

/** The get-review wrappers' value: the review with entries and the viewer's flags (spec 5.3). */
export interface ReviewWithAssignmentsAndViewerFlags {
    review: ReviewWithAssignments;
    flags: ReviewViewerFlags;
}
```

In `packages/api-workflows/src/domain/assignment/assignment.model.ts`, replace:

```ts
                    source: fields.text().label("Source"),
```

with:

```ts
                    source: fields.text().label("Source"),
                    ruleId: fields.text().label("Rule ID"),
```

Create `packages/api-workflows/src/domain/assignment/toAssignmentRecordValues.ts`:

```ts
import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { AssignmentRecordValues } from "./types.js";

/**
 * The assignment-log records one saved fact produces, in decision order (spec 4.3, 6, R117).
 * Pure. Step reached carries the resolver's skips and outcome; start and take over carry one
 * outcome. `assignedOn` is the fact's time, which is the reach `now`. Every fact type has a case,
 * so a new fact does not compile until it says whether it writes records.
 */
export const toAssignmentRecordValues = (
    review: ReviewData,
    fact: ReviewFact
): AssignmentRecordValues[] => {
    switch (fact.type) {
        case "stepReached":
        case "stepStarted":
        case "stepTakenOver":
            return fact.records.map((record): AssignmentRecordValues => {
                return {
                    ...record,
                    by: record.by ? { ...record.by } : null,
                    reviewId: review.id,
                    workflowId: review.workflowId,
                    stepId: fact.change.stepId,
                    assignedOn: fact.occurredOn
                };
            });
        case "requested":
        case "stepApproved":
        case "stepRejected":
        case "cancelled":
        case "approved":
            return [];
    }
};
```

In `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`, replace:

```ts
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
```

with:

```ts
import type {
    AssignmentRecord,
    AssignmentRecordValues,
    AssignmentSource
} from "~/domain/assignment/types.js";
```

replace:

```ts
    source: string;
    by: ActorEntryValues | null;
    reason: string | null;
    kind: string | null;
}
```

with:

```ts
    source: string;
    ruleId: string | null;
    by: ActorEntryValues | null;
    reason: string | null;
    kind: string | null;
}
```

in `toValues` replace:

```ts
            source: values.source,
            by: values.by ? ActorEntryMapper.toEntry(values.by) : null,
```

with:

```ts
            source: values.source,
            ruleId: values.ruleId,
            by: values.by ? ActorEntryMapper.toEntry(values.by) : null,
```

and in `fromEntry` replace:

```ts
            source: entry.values.source,
            by: ActorEntryMapper.fromEntry(entry.values.by),
```

with:

```ts
            // Only the engine writes this model, always with an `AssignmentSource` (R109).
            source: entry.values.source as AssignmentSource,
            ruleId: entry.values.ruleId || null,
            by: ActorEntryMapper.fromEntry(entry.values.by),
```

- [ ] **Step 4: Review types, facts and the aggregate**

In `packages/api-workflows/src/domain/review/types.ts`, replace:

```ts
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
```

with:

```ts
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import type { AssignmentDecision, AssignmentSource } from "~/domain/assignment/types.js";
```

replace:

```ts
/** "Why this owner" (D127). Sources: rule id, "strategy", "picked", "pool", "poolStart", "takeOver", "reassign". */
export interface ReviewStepAssignment {
    source: string;
    ruleId?: string;
```

with:

```ts
/** "Why this owner" (D127, R109). `ruleId`: the rule that decided, also for a team target. */
export interface ReviewStepAssignment {
    source: AssignmentSource;
    ruleId?: string;
```

replace:

```ts
    assignmentSource: string | null;
    assignment: ReviewStepAssignment | null;
```

with:

```ts
    assignmentSource: AssignmentSource | null;
    assignment: ReviewStepAssignment | null;
```

and replace:

```ts
/** Result of assignment resolution on step reached (spec 5.2, 6). */
export interface StepAssignmentResolution {
    owner: Actor | null;
    candidateTeamIds: string[];
    assignment: ReviewStepAssignment;
}
```

with:

```ts
/** Result of assignment resolution on step reached (spec 5.2, 6). */
export interface StepAssignmentResolution {
    owner: Actor | null;
    candidateTeamIds: string[];
    assignment: ReviewStepAssignment;
    /**
     * The assignment-log records of this decision, in order: skips first, then one outcome
     * (R117). Written by `ReviewSaver` after the review is saved.
     */
    records: AssignmentDecision[];
}
```

In `packages/api-workflows/src/domain/review/facts.ts`, replace:

```ts
import type { Actor, ReviewStepAssignment, StepState } from "./types.js";
```

with:

```ts
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { Actor, ReviewStepAssignment, StepState } from "./types.js";
```

and replace:

```ts
    owner: Actor | null;
    change: ReviewStepChange;
    assignment: ReviewStepAssignment;
}

export interface ReviewStepStartedFact {
    type: "stepStarted";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
}

export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
}
```

with:

```ts
    owner: Actor | null;
    change: ReviewStepChange;
    assignment: ReviewStepAssignment;
    /** The resolver's skips and outcome; `ReviewSaver` writes them after the save (R117). */
    records: AssignmentDecision[];
}

export interface ReviewStepStartedFact {
    type: "stepStarted";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    /** One `poolStart` outcome (R117, A49). */
    records: AssignmentDecision[];
}

export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
    /** One `takeOver` outcome with `by` (R117, A49). */
    records: AssignmentDecision[];
}
```

In `packages/api-workflows/src/domain/review/Review.ts`, in `reach`, replace:

```ts
            change: { stepId: step.id, fromState: "pending", toState: step.state },
            assignment: structuredClone(resolution.assignment)
        });
        return Result.ok();
    }
```

with:

```ts
            change: { stepId: step.id, fromState: "pending", toState: step.state },
            assignment: structuredClone(resolution.assignment),
            records: structuredClone(resolution.records)
        });
        return Result.ok();
    }
```

in `start`, replace:

```ts
            change: { stepId: step.id, fromState: "awaiting", toState: "inReview" }
        });
        return Result.ok();
    }
```

with:

```ts
            change: { stepId: step.id, fromState: "awaiting", toState: "inReview" },
            records: [
                {
                    kind: "outcome",
                    userId: params.actor.id,
                    source: "poolStart",
                    ruleId: null,
                    by: null,
                    reason: null
                }
            ]
        });
        return Result.ok();
    }
```

in `takeOver`, replace:

```ts
            change: { stepId: step.id, fromState: "inReview", toState: "inReview" },
            previousOwner: { ...previousOwner }
        });
```

with:

```ts
            change: { stepId: step.id, fromState: "inReview", toState: "inReview" },
            previousOwner: { ...previousOwner },
            records: [
                {
                    kind: "outcome",
                    userId: params.actor.id,
                    source: "takeOver",
                    ruleId: null,
                    by: { ...params.actor },
                    reason: null
                }
            ]
        });
```

and replace the body of `withoutRequesterOwner`:

```ts
        return {
            owner: null,
            candidateTeamIds: [...resolution.candidateTeamIds],
            assignment: { source: "pool", reason: REQUESTER_OWNER_REASON }
        };
```

with:

```ts
        return {
            owner: null,
            candidateTeamIds: [...resolution.candidateTeamIds],
            assignment: { source: "pool", reason: REQUESTER_OWNER_REASON },
            // The resolver's skips stay; its outcome is replaced by the pool (R117).
            records: [
                ...resolution.records.filter(record => record.kind === "skip"),
                {
                    kind: "outcome",
                    userId: null,
                    source: "pool",
                    ruleId: null,
                    by: null,
                    reason: REQUESTER_OWNER_REASON
                }
            ]
        };
```

In `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`, replace:

```ts
import type {
    ReviewData,
    ReviewState,
```

with:

```ts
import type { AssignmentSource } from "~/domain/assignment/types.js";
import type {
    ReviewData,
    ReviewState,
```

in `stepFromEntry` replace:

```ts
            assignmentSource: step.assignmentSource ?? null,
```

with:

```ts
            // Only the engine writes this model, always with an `AssignmentSource` (R109).
            assignmentSource: (step.assignmentSource as AssignmentSource | null) ?? null,
```

and in `assignmentFromEntry` replace:

```ts
            source: value.source,
            ...(value.ruleId ? { ruleId: value.ruleId } : {}),
```

with:

```ts
            source: value.source as AssignmentSource,
            ...(value.ruleId ? { ruleId: value.ruleId } : {}),
```

- [ ] **Step 5: Resolver `now`, the pool resolver and the reacher**

In `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`, replace:

```ts
    /** The review step being reached; carries `pickedUserId` and the step config. */
    step: ReviewStep;
}
```

with:

```ts
    /** The review step being reached; carries `pickedUserId` and the step config. */
    step: ReviewStep;
    /**
     * The reach time (R118): exclusion expiry and the records' `assignedOn` use it. Routing never
     * calls `new Date()`.
     */
    now: Date;
}
```

Replace the whole `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts` with:

```ts
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { StepAssignmentResolver } from "./abstractions.js";

/** Every review step goes to its teams' pool. Replaced by the routing resolver (phase 4). */
class PoolStepAssignmentResolverImpl implements StepAssignmentResolver.Interface {
    async resolve(
        params: StepAssignmentResolver.Params
    ): Promise<StepAssignmentResolver.Resolution> {
        // Save-time validation guarantees a parsable config. An unparsable one (edited storage)
        // leaves an empty pool; phase 5 fails such steps ("fail on invalid settings").
        const config = parseReviewStepConfig(params.step.config);
        return {
            owner: null,
            candidateTeamIds: config ? [...config.teams] : [],
            assignment: { source: "pool" },
            records: [
                {
                    kind: "outcome",
                    userId: null,
                    source: "pool",
                    ruleId: null,
                    by: null,
                    reason: null
                }
            ]
        };
    }
}

export const PoolStepAssignmentResolver = StepAssignmentResolver.createImplementation({
    implementation: PoolStepAssignmentResolverImpl,
    dependencies: []
});
```

In `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`, replace:

```ts
        const resolution = await this.resolver.resolve({ review: params.review.toData(), step });
```

with:

```ts
        const resolution = await this.resolver.resolve({
            review: params.review.toData(),
            step,
            now: new Date(params.now)
        });
```

- [ ] **Step 6: `ReviewSaver` writes the records after the save**

In `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`, replace:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
```

with:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { toAssignmentRecordValues } from "~/domain/assignment/toAssignmentRecordValues.js";
```

replace the constructor:

```ts
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSyncs: ReviewTargetSync.Interface[],
        private eventPublisher: EventPublisher.Interface
    ) {}
```

with:

```ts
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSyncs: ReviewTargetSync.Interface[],
        private eventPublisher: EventPublisher.Interface,
        private assignments: AssignmentRepository.Interface,
        private logger: Logger.Interface
    ) {}
```

replace:

```ts
        const saved = result.value;

        // One sync per namespace; the last registered match wins. No match: nothing to sync.
```

with:

```ts
        const saved = result.value;

        // The review is saved, so its assignment decisions happened: write them to the log
        // (R117). Writing after the save leaves no orphaned records when the save fails; a failed
        // write is logged and never fails the request.
        for (const fact of facts) {
            for (const values of toAssignmentRecordValues(saved, fact)) {
                try {
                    const created = await this.assignments.create(values);
                    if (created.isFail()) {
                        this.logger.error(
                            {
                                error: created.error,
                                reviewId: saved.id,
                                stepId: values.stepId,
                                source: values.source
                            },
                            "Could not write an assignment record; the review was saved without it."
                        );
                    }
                } catch (error) {
                    this.logger.error(
                        {
                            error,
                            reviewId: saved.id,
                            stepId: values.stepId,
                            source: values.source
                        },
                        "Could not write an assignment record; the review was saved without it."
                    );
                }
            }
        }

        // One sync per namespace; the last registered match wins. No match: nothing to sync.
```

and replace:

```ts
    dependencies: [ReviewRepository, [ReviewTargetSync, { multiple: true }], EventPublisher]
```

with:

```ts
    dependencies: [
        ReviewRepository,
        [ReviewTargetSync, { multiple: true }],
        EventPublisher,
        AssignmentRepository,
        Logger
    ]
```

In `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`, replace:

```ts
 * The single save path for reviews (R10, D19, D52): prepare the review-level fields, persist
 * (create or update), sync `system.workflow`, then publish one event per recorded fact. A failed
 * sync keeps the save and the events and returns `ReviewTargetSyncError` (R16).
```

with:

```ts
 * The single save path for reviews (R10, D19, D52): prepare the review-level fields, persist
 * (create or update), write the facts' assignment records (R117; a failed write is only logged),
 * sync `system.workflow`, then publish one event per recorded fact. A failed sync keeps the save
 * and the events and returns `ReviewTargetSyncError` (R16).
```

- [ ] **Step 7: GraphQL `ruleId`**

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`, in `type WorkflowsAssignmentEntry`, replace:

```graphql
        assignedOn: DateTime!
        source: String!
        by: WorkflowsActor
        reason: String
    }
```

with:

```graphql
        assignedOn: DateTime!
        source: String!
        "The rule that decided or was skipped (R109)."
        ruleId: String
        by: WorkflowsActor
        reason: String
    }
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts packages/api-workflows/__tests__/assignment/ListReviewAssignments.test.ts packages/api-workflows/__tests__/assignment/redactAssignmentRecords.test.ts packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/DeleteTargetReviews.test.ts packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/domain/Review.decisions.test.ts packages/api-workflows/__tests__/domain/Review.checks.test.ts packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same file list with `yarn test:os` (one run at a time).
Expected: PASS.

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`, then the same with `yarn test:os`.
Expected: PASS.

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts 2>&1 | tail -50`, then the same with `yarn test:os`.
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): write assignment records after the review save, with fixed sources and rule ids

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
