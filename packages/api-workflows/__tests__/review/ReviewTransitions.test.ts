import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    expectOk,
    OTHER_TEAM_ID,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";
import type {
    ReviewStepApprovedEvent,
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "~/features/review/events.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";

const resetRecorders = (): void => {
    recordedSyncs.length = 0;
    recordedEvents.length = 0;
};

const syncedValues = () => {
    return recordedSyncs.map(sync => sync.systemWorkflow);
};

const setup = async () => {
    const { context, workflow } = await createReviewContext();
    const requestReview = context.container.resolve(RequestReviewUseCase);
    const requested = expectOk(await requestReview.execute(createRequestInput()));
    resetRecorders();
    const reviewId = requested.id;

    return {
        workflow,
        reviewId,
        requestReview,
        start: context.container.resolve(StartReviewStepUseCase),
        takeOver: context.container.resolve(TakeOverReviewStepUseCase),
        approve: context.container.resolve(ApproveReviewStepUseCase),
        reject: context.container.resolve(RejectReviewStepUseCase),
        cancel: context.container.resolve(CancelReviewUseCase),
        actorInput: (actor: Actor = reviewer, stepId = "legal") => ({
            reviewId,
            stepId,
            actor,
            actorTeamIds: [REVIEW_TEAM_ID]
        })
    };
};

describe("Review transitions", () => {
    it("starts the awaiting step and syncs the new step state", async () => {
        const { start, actorInput, workflow } = await setup();

        const result = await start.execute(actorInput());

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: reviewer.id
        });
        expect(result.value.steps[0]).toMatchObject({
            owner: reviewer,
            assignment: { source: "poolStart" }
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "inReview"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepStarted"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepStarted"
        ) as ReviewStepStartedEvent;
        expect(event.payload.fact.actor).toEqual(reviewer);
        expect(event.payload.review).toEqual(result.value);
    });

    it("does not let the requester, a non-member or a non-user start the step", async () => {
        const { start, actorInput, reviewId } = await setup();

        const byRequester = await start.execute(actorInput(requester));
        const byOutsider = await start.execute({
            reviewId,
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [OTHER_TEAM_ID]
        });
        const byAutomation = await start.execute(
            actorInput({ type: "automation", id: "user-reviewer", displayName: "Automation" })
        );

        expect(byRequester.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(byOutsider.error.code).toBe("Workflows/Review/NotCandidate");
        expect(byAutomation.error.code).toBe("Workflows/Review/ActorNotUser");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("takes over a step from its owner and syncs it once", async () => {
        const { start, takeOver, actorInput, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await takeOver.execute(actorInput(otherReviewer));

        expect(result.isOk()).toBe(true);
        expect(result.value.currentOwnerId).toBe(otherReviewer.id);
        expect(result.value.steps[0].assignment).toEqual({
            source: "takeOver",
            by: otherReviewer
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "inReview"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepTakenOver"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepTakenOver"
        ) as ReviewStepTakenOverEvent;
        expect(event.payload.fact.previousOwner).toEqual(reviewer);

        const again = await takeOver.execute(actorInput(otherReviewer));
        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("does not let the requester or a non-member take over", async () => {
        const { start, takeOver, actorInput, reviewId } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const byRequester = await takeOver.execute(actorInput(requester));
        const byOutsider = await takeOver.execute({
            reviewId,
            stepId: "legal",
            actor: otherReviewer,
            actorTeamIds: [OTHER_TEAM_ID]
        });

        expect(byRequester.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(byOutsider.error.code).toBe("Workflows/Review/NotCandidate");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("approving a step reaches the next one", async () => {
        const { start, approve, actorInput, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        const notOwner = await approve.execute({ ...actorInput(otherReviewer), comment: "Fine." });
        expect(notOwner.error.code).toBe("Workflows/Review/NotOwner");
        resetRecorders();

        const result = await approve.execute({ ...actorInput(), comment: "Looks good." });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "inProgress",
            currentStepId: "editorial",
            currentStepState: "awaiting",
            currentOwnerId: null
        });
        expect(result.value.steps[0]).toMatchObject({ state: "approved", comment: "Looks good." });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "editorial",
                stepName: "Editorial review",
                stepState: "awaiting"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/StepReached"
        ]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepApproved"
        ) as ReviewStepApprovedEvent;
        expect(event.payload.fact.comment).toBe("Looks good.");
        expect(event.payload.fact.actor).toEqual(reviewer);
    });

    it("refuses a stale approve for a step that is no longer current", async () => {
        const { start, approve, actorInput } = await setup();
        expectOk(await start.execute(actorInput()));
        expectOk(await approve.execute(actorInput()));
        expectOk(await start.execute(actorInput(reviewer, "editorial")));
        resetRecorders();

        // A repeated "approve legal" must not approve "editorial", which the same user now holds.
        const stale = await approve.execute(actorInput());

        expect(stale.isFail()).toBe(true);
        expect(stale.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(stale.error.data).toMatchObject({ stepId: "legal", currentStepId: "editorial" });
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("approving the last step approves the review", async () => {
        const { start, approve, cancel, actorInput, reviewId, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        expectOk(await approve.execute(actorInput()));
        expectOk(await start.execute(actorInput(reviewer, "editorial")));
        resetRecorders();

        const result = await approve.execute(actorInput(reviewer, "editorial"));

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "approved",
            isActive: true,
            currentStepId: "editorial",
            currentStepState: "approved",
            currentOwnerId: reviewer.id
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "approved",
                stepId: "editorial",
                stepName: "Editorial review",
                stepState: "approved"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/Approved"
        ]);

        const cancelled = await cancel.execute({ reviewId, actor: requester });
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("rejecting a step rejects the review for good", async () => {
        const { start, reject, approve, cancel, actorInput, reviewId, workflow } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await reject.execute({ ...actorInput(), comment: "Needs another pass." });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "rejected",
            isActive: true,
            currentStepId: "legal",
            currentStepState: "rejected",
            currentOwnerId: reviewer.id
        });
        expect(syncedValues()).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "rejected",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "rejected"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
        expect((await approve.execute(actorInput())).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
        expect((await cancel.execute({ reviewId, actor: requester })).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });

    it("cancelling clears the current step, unlocks the target and allows a new request", async () => {
        const { start, cancel, actorInput, reviewId, requestReview } = await setup();
        expectOk(await start.execute(actorInput()));
        resetRecorders();

        const result = await cancel.execute({ reviewId, actor: requester });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: []
        });
        expect(syncedValues()).toEqual([null]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);

        const again = await requestReview.execute(createRequestInput());
        expect(again.isOk()).toBe(true);
        expect(again.value.id).not.toBe(reviewId);
    });

    it("returns NotFound for an unknown review", async () => {
        const { start } = await setup();

        const result = await start.execute({
            reviewId: "missing",
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
