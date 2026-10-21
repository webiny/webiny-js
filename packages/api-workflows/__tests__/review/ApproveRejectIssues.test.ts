import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    createAiIssue,
    expectOk,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import type { ReviewStepApprovedEvent, ReviewStepRejectedEvent } from "~/features/review/events.js";

const setup = async () => {
    const { context } = await createReviewContext();
    const requested = expectOk(
        await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
    );
    const actorInput = {
        reviewId: requested.id,
        stepId: "legal",
        actor: reviewer,
        actorTeamIds: [REVIEW_TEAM_ID]
    };
    expectOk(await context.container.resolve(StartReviewStepUseCase).execute(actorInput));
    recordedEvents.length = 0;
    return {
        actorInput,
        approve: context.container.resolve(ApproveReviewStepUseCase),
        reject: context.container.resolve(RejectReviewStepUseCase),
        read: async () => {
            return expectOk(
                await context.container.resolve(GetReviewUseCase).execute({ id: requested.id })
            );
        }
    };
};

describe("ApproveReviewStepUseCase issues (R171)", () => {
    it("stores the issues on the approved step and returns them", async () => {
        const { actorInput, approve, read } = await setup();
        const issues = [createAiIssue(), createAiIssue({ fieldPath: null, suggestion: null })];

        const result = expectOk(
            await approve.execute({ ...actorInput, comment: "Fine with notes.", issues })
        );

        expect(result.steps[0]).toMatchObject({ state: "approved", comment: "Fine with notes." });
        expect(result.steps[0].issues).toEqual(issues);
        expect((await read()).steps[0].issues).toEqual(issues);
        expect((await read()).steps[1].issues).toEqual([]);
    });

    it("stores no issues when the input has none (default [])", async () => {
        const { actorInput, approve, read } = await setup();

        expectOk(await approve.execute(actorInput));

        expect((await read()).steps[0].issues).toEqual([]);
    });

    it("keeps the event fact free of issues and puts them in the review snapshot", async () => {
        const { actorInput, approve } = await setup();
        const issues = [createAiIssue()];

        expectOk(await approve.execute({ ...actorInput, comment: "Fine.", issues }));

        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepApproved"
        ) as ReviewStepApprovedEvent;
        expect(event.payload.fact).toEqual({
            type: "stepApproved",
            occurredOn: expect.any(String),
            actor: reviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "approved" },
            comment: "Fine."
        });
        expect(event.payload.review.steps[0].issues).toEqual(issues);
    });

    it("stores nothing for an actor that does not own the step", async () => {
        const { actorInput, approve, read } = await setup();

        const result = await approve.execute({
            ...actorInput,
            actor: otherReviewer,
            issues: [createAiIssue()]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
        expect((await read()).steps[0]).toMatchObject({ state: "inReview", issues: [] });
        expect(recordedEvents).toEqual([]);
    });
});

describe("RejectReviewStepUseCase issues (R171)", () => {
    it("stores the issues on the rejected step and returns them", async () => {
        const { actorInput, reject, read } = await setup();
        const issues = [createAiIssue({ severity: "error", message: "The body is empty." })];

        const result = expectOk(
            await reject.execute({ ...actorInput, comment: "The body is empty.", issues })
        );

        expect(result).toMatchObject({ state: "rejected" });
        expect(result.steps[0].issues).toEqual(issues);
        expect((await read()).steps[0].issues).toEqual(issues);
    });

    it("stores no issues when the input has none (default [])", async () => {
        const { actorInput, reject, read } = await setup();

        expectOk(await reject.execute({ ...actorInput, comment: "Not ready to publish." }));

        expect((await read()).steps[0].issues).toEqual([]);
    });

    it("keeps the event fact free of issues and puts them in the review snapshot", async () => {
        const { actorInput, reject } = await setup();
        const issues = [createAiIssue({ severity: "error" })];

        expectOk(await reject.execute({ ...actorInput, comment: "Not ready to publish.", issues }));

        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepRejected"
        ) as ReviewStepRejectedEvent;
        expect(event.payload.fact).toEqual({
            type: "stepRejected",
            occurredOn: expect.any(String),
            actor: reviewer,
            change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
            comment: "Not ready to publish."
        });
        expect(event.payload.review.steps[0].issues).toEqual(issues);
    });

    it("stores nothing when the comment is too short", async () => {
        const { actorInput, reject, read } = await setup();

        const result = await reject.execute({
            ...actorInput,
            comment: "No.",
            issues: [createAiIssue()]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(await read()).toMatchObject({ state: "inProgress" });
        expect((await read()).steps[0].issues).toEqual([]);
        expect(recordedEvents).toEqual([]);
    });
});
