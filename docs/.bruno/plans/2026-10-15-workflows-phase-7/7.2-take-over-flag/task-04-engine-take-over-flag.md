### Task 4: `notifyPreviousOwner` on the engine input and on the fact

Spec 5.1, 11; D111, D132; R185, R198; Review Focus 7. The take-over action carries one opt-out, the per-action flag (user answer Q2):

- `TakeOverReviewStepUseCase.Input` becomes `TakeOverReviewStepInput extends ReviewActorInput { notifyPreviousOwner?: boolean }`. Missing and `undefined` mean `true` (notify). The use case passes `notifyPreviousOwner: input.notifyPreviousOwner ?? true` to `review.takeOver`.
- `Review.takeOver(params: ReviewTakeOverParams)` with `ReviewTakeOverParams extends ReviewActorParams { notifyPreviousOwner?: boolean }`. The aggregate defaults a missing flag to `true` too (second line of defence, the aggregate is also called directly in tests and by later callers) and writes the resolved boolean on the fact: `notifyPreviousOwner: params.notifyPreviousOwner ?? true`.
- `ReviewStepTakenOverFact` gains `notifyPreviousOwner: boolean`, always set (never optional on the fact, so the handler in Task 11 reads a boolean, not a maybe). Doc comment: `D111: whether the previous owner is told; the opt-out is this one fact, never stored.`
- The flag is not stored on the review, the step, an assignment record or anywhere else (storage keys frozen, R185). `checkTakeOver` is unchanged (the flag does not affect whether a take over is allowed). `getReviewViewerFlags` and the reassign path are untouched (reassign has no flag, D111).
- The suppression itself (no take-over notice when the flag is `false`) is the handler's job in Task 11; this task only guarantees the fact carries the flag, so Review Focus 7 is pinned here for the engine half (default `true`, explicit `true`, explicit `false` reach the fact and the published event) and in Task 5 for the two wrappers and the two GraphQL mutations.
- Two existing tests build or compare a `stepTakenOver` fact literal and gain only the new field: `__tests__/domain/Review.request.test.ts` (the `Review.takeOver` expected fact) and `__tests__/assignment/toAssignmentRecordValues.test.ts` (the `takenOver` fact literal, typed `ReviewFact`). Nothing else in the three packages builds this fact (checked: `grep -rn "stepTakenOver"` over `packages/*/src` and `packages/*/__tests__`).

**Files:**
- Modify: `packages/api-workflows/src/domain/review/facts.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/TakeOverReviewStep/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/TakeOverReviewStep/TakeOverReviewStepUseCase.ts`
- Modify (test): `packages/api-workflows/__tests__/domain/Review.request.test.ts`
- Modify (test): `packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts`
- Modify (test): `packages/api-workflows/__tests__/review/ReviewTransitions.test.ts`

**Interfaces:**
- Consumes (existing code, unchanged):
  - `ReviewActorInput { reviewId; stepId; actor; actorTeamIds }` (`~/features/review/shared/types.js`).
  - `ReviewActorParams extends ReviewActorCheckParams { now: string }` (`~/domain/review/Review.js`); `Review.takeOver(params): Result<void, ReviewTakeOverError>`.
  - Test helpers: `createReviewContext`, `createRequestInput` (`~tests/__helpers/reviewContext.js`), `recordedEvents`, `workflowEventTypes` (`~tests/__helpers/RecordingEventPublisher.js`), `createStartedReview`, `expectOk`, `otherReviewer`, `reviewer`, `REVIEW_TEAM_ID`, `LATER` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `TakeOverReviewStepInput { notifyPreviousOwner?: boolean }` extending `ReviewActorInput`, exported from `abstractions.ts`; `TakeOverReviewStepUseCase.Input = TakeOverReviewStepInput`.
  - `ReviewTakeOverParams extends ReviewActorParams { notifyPreviousOwner?: boolean }` (exported from `Review.ts`).
  - `ReviewStepTakenOverFact.notifyPreviousOwner: boolean`. Consumed by Tasks 5 (wrappers) and 11 (take-over handler).

- [ ] **Step 1: Write the failing tests**

In `packages/api-workflows/__tests__/domain/Review.request.test.ts`, inside `describe("Review.takeOver", ...)`, change the first test's expected fact (the field is added after `previousOwner`) and add two tests directly after that test. The first test becomes:

```ts
describe("Review.takeOver", () => {
    it("moves a human step to another candidate", () => {
        const review = createStartedReview();

        const result = review.takeOver(onLegal(otherReviewer));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: otherReviewer,
            assignmentSource: "takeOver",
            assignment: { source: "takeOver", by: otherReviewer },
            startedOn: NOW
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepTakenOver",
                occurredOn: LATER,
                actor: otherReviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
                previousOwner: reviewer,
                notifyPreviousOwner: true,
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
    });

    it("puts an explicit notifyPreviousOwner true and false on the fact (D111)", () => {
        const notified = createStartedReview();
        const silent = createStartedReview();

        const notifiedResult = notified.takeOver({
            ...onLegal(otherReviewer),
            notifyPreviousOwner: true
        });
        const silentResult = silent.takeOver({
            ...onLegal(otherReviewer),
            notifyPreviousOwner: false
        });

        expect(notifiedResult.isOk()).toBe(true);
        expect(silentResult.isOk()).toBe(true);
        expect(notified.pullFacts()).toMatchObject([{ type: "stepTakenOver", notifyPreviousOwner: true }]);
        expect(silent.pullFacts()).toMatchObject([{ type: "stepTakenOver", notifyPreviousOwner: false }]);
    });

    it("counts an undefined notifyPreviousOwner as true and never stores the flag (R185)", () => {
        const review = createStartedReview();

        const result = review.takeOver({
            ...onLegal(otherReviewer),
            notifyPreviousOwner: undefined
        });

        expect(result.isOk()).toBe(true);
        expect(review.pullFacts()).toMatchObject([{ type: "stepTakenOver", notifyPreviousOwner: true }]);
        expect(JSON.stringify(review.toData())).not.toContain("notifyPreviousOwner");
    });
```

The remaining tests of the describe (`does not let the current owner take over` and on) stay as they are, directly after these.

In `packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts`, the `takenOver` literal gains the field:

```ts
        const takenOver: ReviewFact = {
            type: "stepTakenOver",
            occurredOn: LATER,
            actor: otherReviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
            previousOwner: reviewer,
            notifyPreviousOwner: true,
            records: [
                { ...OUTCOME, userId: otherReviewer.id, source: "takeOver", by: otherReviewer }
            ]
        };
```

In `packages/api-workflows/__tests__/review/ReviewTransitions.test.ts`, extend the existing test `takes over a step from its owner and syncs it once` (add one assertion after the `previousOwner` assertion) and add three tests after it. The assertion:

```ts
        expect(event.payload.fact.previousOwner).toEqual(reviewer);
        expect(event.payload.fact.notifyPreviousOwner).toBe(true);
```

The new tests, placed right after `takes over a step from its owner and syncs it once` (before `does not let the requester or a non-member take over`):

```ts
    it("puts notifyPreviousOwner true on the published fact when the input omits it (D111)", async () => {
        const { start, takeOver, actorInput } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await takeOver.execute(actorInput(otherReviewer));

        expect(result.isOk()).toBe(true);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepTakenOver"
        ) as ReviewStepTakenOverEvent;
        expect(event.payload.fact.notifyPreviousOwner).toBe(true);
    });

    it("puts an explicit notifyPreviousOwner true on the published fact (D111)", async () => {
        const { start, takeOver, actorInput } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await takeOver.execute({
            ...actorInput(otherReviewer),
            notifyPreviousOwner: true
        });

        expect(result.isOk()).toBe(true);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepTakenOver"
        ) as ReviewStepTakenOverEvent;
        expect(event.payload.fact.notifyPreviousOwner).toBe(true);
    });

    it("puts an explicit notifyPreviousOwner false on the published fact and still takes over (D111)", async () => {
        const { start, takeOver, actorInput } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await takeOver.execute({
            ...actorInput(otherReviewer),
            notifyPreviousOwner: false
        });

        expect(result.isOk()).toBe(true);
        expect(result.value.currentOwnerId).toBe(otherReviewer.id);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepTakenOver"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepTakenOver"
        ) as ReviewStepTakenOverEvent;
        expect(event.payload.fact.notifyPreviousOwner).toBe(false);
        expect(event.payload.fact.previousOwner).toEqual(reviewer);
        expect(JSON.stringify(result.value)).not.toContain("notifyPreviousOwner");
    });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
Expected: FAIL. `moves a human step to another candidate` finds a fact without `notifyPreviousOwner` (the expected literal has it), the explicit `true` and `false` tests and the `undefined` test see `notifyPreviousOwner` missing on the fact.

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL. The published fact has no `notifyPreviousOwner` (`undefined` is not `true`/`false`).

`__tests__/assignment/toAssignmentRecordValues.test.ts` does not fail at run time (the converter ignores the field); it fails at type level only (the `ReviewFact` literal has an unknown property), which the type check in Step 4 covers.

Run the same two with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
`yarn test:os packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: Implementation**

In `packages/api-workflows/src/domain/review/facts.ts`, the take-over fact:

```ts
export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
    /** D111: whether the previous owner is told; the opt-out is this one fact, never stored. */
    notifyPreviousOwner: boolean;
    /** One `takeOver` outcome with `by` (R117, A49). */
    records: AssignmentDecision[];
}
```

In `packages/api-workflows/src/domain/review/Review.ts`, add the params type directly after `ReviewActorParams`:

```ts
export interface ReviewActorParams extends ReviewActorCheckParams {
    now: string;
}

export interface ReviewTakeOverParams extends ReviewActorParams {
    /** D111: whether the previous owner is told; omitted means true. Carried on the fact, never stored. */
    notifyPreviousOwner?: boolean;
}
```

and change `takeOver` (signature and the pushed fact; the rest of the method is unchanged):

```ts
    public takeOver(params: ReviewTakeOverParams): Result<void, ReviewTakeOverError> {
        const guard = this.guardTakeOver(params);
        if (guard.isFail()) {
            return Result.fail(guard.error);
        }
        const { step, owner: previousOwner } = guard.value;

        step.owner = { ...params.actor };
        step.assignmentSource = "takeOver";
        step.assignment = { source: "takeOver", by: { ...params.actor } };

        this.facts.push({
            type: "stepTakenOver",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "inReview" },
            previousOwner: { ...previousOwner },
            notifyPreviousOwner: params.notifyPreviousOwner ?? true,
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
        return Result.ok();
    }
```

In `packages/api-workflows/src/features/review/TakeOverReviewStep/abstractions.ts`, add the input interface and use it (imports and the errors interface stay; only the shown members change):

```ts
export interface TakeOverReviewStepInput extends ReviewActorInput {
    /** D111: whether the previous owner is told; omitted means true. Reaches the fact, never stored. */
    notifyPreviousOwner?: boolean;
}

type UseCaseError = ITakeOverReviewStepUseCaseErrors[keyof ITakeOverReviewStepUseCaseErrors];

export interface ITakeOverReviewStepUseCase {
    execute(input: TakeOverReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Another candidate takes a human step in review (spec 5.1 "take over", D32, D9). */
export const TakeOverReviewStepUseCase = createAbstraction<ITakeOverReviewStepUseCase>(
    "TakeOverReviewStepUseCase"
);

export namespace TakeOverReviewStepUseCase {
    export type Interface = ITakeOverReviewStepUseCase;
    export type Input = TakeOverReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

In `packages/api-workflows/src/features/review/TakeOverReviewStep/TakeOverReviewStepUseCase.ts`, the `takeOver` call:

```ts
        const takenOver = review.takeOver({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            notifyPreviousOwner: input.notifyPreviousOwner ?? true,
            now: new Date().toISOString()
        });
```

`index.ts` and `feature.ts` do not change (the barrel keeps exporting the abstraction and `ReviewActorInput`; the new interface is reachable as `TakeOverReviewStepUseCase.Input`).

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn test packages/api-workflows/__tests__/assignment/toAssignmentRecordValues.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same three with `yarn test:os` (one run at a time), for example:
`yarn test:os packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors in the touched package (the fact literal in `toAssignmentRecordValues.test.ts` type-checks only with the new field).

- [ ] **Step 5: Run the existing tests covering the changed code**

These build or run a take over and must stay green unchanged (the phase 2-3 take-over tests pass with only the fact literal field added above):

Run one file per command: `yarn test packages/api-workflows/__tests__/domain/Review.checks.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/domain/getReviewViewerFlags.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/RoutingStrategyService.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS each.

Run the same five with `yarn test:os` (one at a time), for example:
`yarn test:os packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts 2>&1 | tail -50`
Expected: PASS each.

- [ ] **Step 6: Commit**

Run the Global Constraints pre-commit chain from `00-shared.md` in full, building each changed package (`@webiny/api-workflows`) with `--no-cache`, restore `.gitleaks.toml`, then commit:

```
git commit -m "feat(api-workflows): carry notifyPreviousOwner on the take-over input and fact" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```
