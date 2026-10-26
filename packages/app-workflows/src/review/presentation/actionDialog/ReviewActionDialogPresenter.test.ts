import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { StepState } from "~/review/domain/StepState.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewActionDialogPresenterFeature } from "./feature.js";
import type { ReviewActionDialogInitParams } from "./abstractions.js";
import type { ReviewActionRequest } from "./ReviewActionRequest.js";
import { createActor } from "~/review/testing/createActor.js";
import { createReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import type { ReviewUseCaseFakes } from "~/review/testing/createReviewUseCaseFakes.js";
import { registerReviewUseCaseFakes } from "~/review/testing/registerReviewUseCaseFakes.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import { at } from "~/review/testing/at.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

const inReviewReview = () => {
    return createReview({
        currentStepId: "step-1",
        currentStepState: StepState.InReview,
        steps: [
            createStep({
                id: "step-1",
                title: "Legal sign-off",
                state: StepState.InReview,
                owner: LUKA
            })
        ]
    });
};

const FAILED_AT = at(10, 20);

const failedReview = () => {
    return createReview({
        currentStepId: "step-1",
        currentStepState: StepState.Failed,
        steps: [
            createStep({
                id: "step-1",
                title: "AI tone check",
                type: "ai",
                state: StepState.Failed,
                owner: createActor({ type: "ai" }),
                comment: "Provider unavailable: request timed out after 60 s",
                finishedOn: FAILED_AT
            })
        ]
    });
};

const runningAgainReview = () => {
    return createReview({
        currentStepId: "step-1",
        currentStepState: StepState.InReview,
        steps: [
            createStep({
                id: "step-1",
                title: "AI tone check",
                type: "ai",
                state: StepState.InReview,
                owner: createActor({ type: "ai" })
            })
        ]
    });
};

interface Setup extends ReviewUseCaseFakes {
    container: Container;
    presenter: ReturnType<typeof ReviewActionDialogPresenterFeature.resolve>["presenter"];
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: (request: ReviewActionRequest) => ReviewActionDialogInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    const fakes = createReviewUseCaseFakes();
    const review = inReviewReview();
    const flags = createFlags();
    const loaded = createReviewWithFlags(review, flags);
    fakes.getReview.execute.mockResolvedValue(loaded);
    registerReviewUseCaseFakes(container, fakes);
    container.registerInstance(ReviewToasts, toasts);
    ReviewActionDialogPresenterFeature.register(container);
    const { presenter } = ReviewActionDialogPresenterFeature.resolve(container);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        ...fakes,
        container,
        presenter,
        toasts,
        onDone,
        onClose,
        params: request => ({
            namespace: "cms.article",
            request,
            reviewsUrl: "/cms/content-reviews",
            onDone,
            onClose
        })
    };
};

const REQUEST = (kind: ReviewActionRequest["kind"]): ReviewActionRequest => {
    return { kind, reviewId: "review-1", stepId: "step-1" };
};

describe("ReviewActionDialogPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the review by id (R234) and is loading before that", async () => {
        const pending = setup.presenter.init(setup.params(REQUEST("approve")));
        expect(setup.presenter.vm.status).toBe("loading");

        await pending;

        expect(setup.getReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1"
        });
        expect(setup.presenter.vm.status).toBe("ready");
    });

    it("fails the load with a dialog error and no confirm", async () => {
        setup.getReview.execute.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params(REQUEST("approve")));

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
    });

    it("builds the start copy", async () => {
        await setup.presenter.init(setup.params(REQUEST("start")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Start “Legal sign-off”?");
        expect(vm.body).toBe(
            "You become the owner of this step on “Spring campaign” and it leaves the team pool."
        );
        expect(vm.confirmLabel).toBe("Start");
        expect(vm.cancelLabel).toBe("Cancel");
        expect(vm.showComment).toBe(false);
        expect(vm.showNotify).toBe(false);
    });

    it("builds the take over copy with a checked notify box (D111)", async () => {
        await setup.presenter.init(setup.params(REQUEST("takeOver")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Take over this step?");
        expect(vm.body).toBe(
            "Luka Perić is reviewing “Legal sign-off”. If you take over, you become the owner and Luka can no longer approve or reject it."
        );
        expect(vm.showNotify).toBe(true);
        expect(vm.notify).toBe(true);
        expect(vm.notifyLabel).toBe("Notify Luka Perić that you took over");
        expect(vm.confirmLabel).toBe("Take over");
    });

    it("hides the notify box when the previous owner is not a person", async () => {
        const review = createReview({
            currentStepId: "step-1",
            steps: [
                createStep({
                    title: "AI check",
                    state: StepState.InReview,
                    owner: createActor({ type: "ai", displayName: "model" })
                })
            ]
        });
        setup.getReview.execute.mockResolvedValue(createReviewWithFlags(review));

        await setup.presenter.init(setup.params(REQUEST("takeOver")));

        expect(setup.presenter.vm.showNotify).toBe(false);
    });

    it("builds the approve copy", async () => {
        await setup.presenter.init(setup.params(REQUEST("approve")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Approve “Legal sign-off”");
        expect(vm.showComment).toBe(true);
        expect(vm.commentLabel).toBe("Comment (optional)");
        expect(vm.commentCounter).toBeNull();
        expect(vm.confirmLabel).toBe("Approve");
    });

    it("builds the reject copy and the counter", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Reject “Legal sign-off”");
        expect(vm.body).toBe(
            "Rejection is final for this revision. The requester will need to create a new revision, fix the issues and request a new review."
        );
        expect(vm.commentLabel).toBe("Comment *");
        expect(vm.commentCounter).toBe("0 / 10 min.");
        expect(vm.confirmLabel).toBe("Reject");
    });

    it("builds the cancel copy with Keep review", async () => {
        await setup.presenter.init(setup.params(REQUEST("cancel")));

        const { vm } = setup.presenter;
        expect(vm.title).toBe("Cancel review?");
        expect(vm.body).toBe(
            "Review progress is lost. Editing is unlocked, and a new request starts again from the first step."
        );
        expect(vm.cancelLabel).toBe("Keep review");
        expect(vm.confirmLabel).toBe("Cancel review");
    });

    it("blocks a reject under 10 trimmed characters and counts the trimmed text (R215)", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));

        setup.presenter.setComment("  too short  ");
        expect(setup.presenter.vm.commentCounter).toBe("9 / 10 min.");
        expect(setup.presenter.vm.canSubmit).toBe(false);
        await setup.presenter.submit();
        expect(setup.rejectReviewStep.execute).not.toHaveBeenCalled();

        setup.presenter.setComment("Missing the disclaimer.");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("sends null for an approve without a comment and the trimmed comment otherwise", async () => {
        await setup.presenter.init(setup.params(REQUEST("approve")));
        await setup.presenter.submit();
        expect(setup.approveReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });

        const second = createSetup();
        second.getReview.execute.mockResolvedValue(
            createReviewWithFlags(inReviewReview(), createFlags())
        );
        await second.presenter.init(second.params(REQUEST("approve")));
        second.presenter.setComment("  Looks good.  ");
        await second.presenter.submit();
        expect(second.approveReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Looks good."
        });
    });

    it("calls the matching use case per kind with the right arguments", async () => {
        await setup.presenter.init(setup.params(REQUEST("start")));
        await setup.presenter.submit();
        expect(setup.startReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "step-1"
        });

        const cancel = createSetup();
        await cancel.presenter.init(
            cancel.params({ kind: "cancel", reviewId: "review-1", stepId: null })
        );
        await cancel.presenter.submit();
        expect(cancel.cancelReview.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1"
        });

        const reject = createSetup();
        await reject.presenter.init(reject.params(REQUEST("reject")));
        reject.presenter.setComment("Missing the disclaimer.");
        await reject.presenter.submit();
        expect(reject.rejectReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Missing the disclaimer."
        });
    });

    it("sends notifyPreviousOwner from the checkbox", async () => {
        await setup.presenter.init(setup.params(REQUEST("takeOver")));
        setup.presenter.setNotify(false);
        await setup.presenter.submit();

        expect(setup.takeOverReviewStep.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
            reviewId: "review-1",
            stepId: "step-1",
            notifyPreviousOwner: false
        });
    });

    it("shows the own-action toast and calls onDone after success (R214)", async () => {
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "started",
            stepTitle: "Legal sign-off",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.submitting).toBe(false);
    });

    it("shows the approve toast with the next step from the returned review (R-g)", async () => {
        setup.approveReviewStep.execute.mockResolvedValue(
            createReview({
                currentStepId: "step-2",
                steps: [
                    createStep({
                        id: "step-1",
                        title: "Legal sign-off",
                        state: StepState.Approved
                    }),
                    createStep({ id: "step-2", title: "Legal check", state: StepState.Awaiting })
                ]
            })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "approved",
            stepTitle: "Legal sign-off",
            personName: null,
            nextStepTitle: "Legal check",
            reviewsUrl: "/cms/content-reviews"
        });
    });

    it("passes nextStepTitle null when the approval finished the review", async () => {
        setup.approveReviewStep.execute.mockResolvedValue(
            createReview({ state: "approved", currentStepId: null })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith(
            expect.objectContaining({ kind: "approved", nextStepTitle: null })
        );
    });

    it("shows the reject and cancel toasts with the exact members (R-g)", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));
        setup.presenter.setComment("Missing the disclaimer.");
        await setup.presenter.submit();
        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "rejected",
            stepTitle: "Legal sign-off",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });

        const cancel = createSetup();
        await cancel.presenter.init(
            cancel.params({ kind: "cancel", reviewId: "review-1", stepId: null })
        );
        await cancel.presenter.submit();
        expect(cancel.toasts.show).toHaveBeenCalledWith({
            kind: "cancelled",
            stepTitle: null,
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
    });

    it("fails the load when a step action names a step the review does not have", async () => {
        await setup.presenter.init(
            setup.params({ kind: "approve", reviewId: "review-1", stepId: null })
        );

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.canSubmit).toBe(false);
    });

    it("keeps the dialog open while submitting, so the success path is not lost", async () => {
        let release: () => void = () => undefined;
        setup.startReviewStep.execute.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve(createReview());
            })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        const pending = setup.presenter.submit();
        setup.presenter.dismiss();
        expect(setup.onClose).not.toHaveBeenCalled();

        release();
        await pending;
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("names the notified person in the take over toast only when notify is ticked", async () => {
        await setup.presenter.init(setup.params(REQUEST("takeOver")));
        await setup.presenter.submit();
        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "tookOver",
            stepTitle: "Legal sign-off",
            personName: "Luka Perić",
            reviewsUrl: "/cms/content-reviews"
        });

        const quiet = createSetup();
        await quiet.presenter.init(quiet.params(REQUEST("takeOver")));
        quiet.presenter.setNotify(false);
        await quiet.presenter.submit();
        expect(quiet.toasts.show).toHaveBeenCalledWith({
            kind: "tookOver",
            stepTitle: "Legal sign-off",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
    });

    it("does not submit twice while submitting", async () => {
        let release: () => void = () => undefined;
        setup.startReviewStep.execute.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve(createReview());
            })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        const first = setup.presenter.submit();
        const second = setup.presenter.submit();
        release();
        await first;
        await second;

        expect(setup.startReviewStep.execute).toHaveBeenCalledTimes(1);
    });

    const CONFLICT_CODES = [
        ReviewErrorCode.StepNotCurrent,
        ReviewErrorCode.InvalidState,
        ReviewErrorCode.NotOwner,
        ReviewErrorCode.AlreadyOwner,
        ReviewErrorCode.StepNotTakeable,
        ReviewErrorCode.StepNotReassignable,
        ReviewErrorCode.ReassignTargetInvalid,
        ReviewErrorCode.AlreadyActive
    ];

    it.each(CONFLICT_CODES)(
        "treats %s as a conflict: stays open, re-reads the review, collapses to Close (Review Focus 6)",
        async code => {
            setup.approveReviewStep.execute.mockRejectedValue(
                new GraphQLOperationError({ message: "Conflict.", code })
            );
            await setup.presenter.init(setup.params(REQUEST("approve")));
            setup.presenter.setComment("My comment");

            await setup.presenter.submit();

            const { vm } = setup.presenter;
            expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
            expect(vm.conflict?.title).toBe("Someone else acted first");
            expect(vm.conflict?.commentKept).toBe(true);
            expect(vm.comment).toBe("My comment");
            expect(vm.submitting).toBe(false);
            expect(setup.toasts.show).not.toHaveBeenCalled();
            expect(setup.onDone).not.toHaveBeenCalled();
        }
    );

    it("passes listRefreshed from Content Reviews into the started-first message (QBZ-31)", async () => {
        setup.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        await setup.presenter.init({ ...setup.params(REQUEST("start")), listRefreshed: true });

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.message).toContain("The list has been refreshed.");
    });

    it("calls onConflict once after the re-read, on a conflict only (F1)", async () => {
        const onConflict = vi.fn();
        setup.approveReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        await setup.presenter.init({ ...setup.params(REQUEST("approve")), onConflict });

        await setup.presenter.submit();

        expect(onConflict).toHaveBeenCalledTimes(1);
        expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
        expect(setup.presenter.vm.conflict).not.toBeNull();
    });

    it("does not call onConflict on success or on other errors (F1)", async () => {
        const onConflict = vi.fn();
        await setup.presenter.init({ ...setup.params(REQUEST("approve")), onConflict });
        await setup.presenter.submit();

        const codes = [ReviewErrorCode.NotAuthorized, ReviewErrorCode.NotFound];
        for (const code of codes) {
            const other = createSetup();
            other.approveReviewStep.execute.mockRejectedValue(
                new GraphQLOperationError({ message: "No.", code })
            );
            await other.presenter.init({ ...other.params(REQUEST("approve")), onConflict });
            await other.presenter.submit();
        }

        expect(onConflict).not.toHaveBeenCalled();
    });

    it("ends the conflict of any action with the list note when listRefreshed (R220)", async () => {
        setup.approveReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        await setup.presenter.init({ ...setup.params(REQUEST("approve")), listRefreshed: true });

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.message).toMatch(/The list has been refreshed\.$/);
    });

    it("maps an initial NotAuthorized or NotFound read to the same messages as submit (F3)", async () => {
        setup.getReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));
        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);

        const missing = createSetup();
        missing.getReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Gone.", code: ReviewErrorCode.NotFound })
        );
        await missing.presenter.init(missing.params(REQUEST("approve")));
        expect(missing.presenter.vm.status).toBe("failed");
        expect(missing.presenter.vm.dialogError).toBe("This review no longer exists.");
    });

    it("does not claim a kept comment when none was typed", async () => {
        setup.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotCurrent
            })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.commentKept).toBe(false);
    });

    it("still reports a conflict when the re-read fails", async () => {
        setup.approveReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.NotOwner })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));
        setup.getReview.execute.mockRejectedValue(new Error("Network."));

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.message).toBe(
            "Someone else changed this review, so your approval was not saved."
        );
    });

    it("shows a Validation error under the comment field", async () => {
        setup.rejectReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Use 500 characters or fewer.",
                code: ReviewErrorCode.Validation
            })
        );
        await setup.presenter.init(setup.params(REQUEST("reject")));
        setup.presenter.setComment("Missing the disclaimer.");

        await setup.presenter.submit();

        expect(setup.presenter.vm.fieldError).toBe("Use 500 characters or fewer.");
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.presenter.vm.conflict).toBeNull();

        setup.presenter.setComment("Missing the disclaimer!");
        expect(setup.presenter.vm.fieldError).toBeNull();
    });

    it("shows dialog-level messages for NotAuthorized and NotFound", async () => {
        setup.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));
        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);

        const missing = createSetup();
        missing.startReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Gone.", code: ReviewErrorCode.NotFound })
        );
        await missing.presenter.init(missing.params(REQUEST("start")));
        await missing.presenter.submit();
        expect(missing.presenter.vm.dialogError).toBe("This review no longer exists.");
    });

    it("shows the server message of a rejection that is not classified", async () => {
        setup.startReviewStep.execute.mockRejectedValueOnce(
            new GraphQLOperationError({
                message: "This content is locked by another review.",
                code: "Workflows/Review/TargetLocked"
            })
        );
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe("This content is locked by another review.");
    });

    it("keeps the dialog open with the transport error text and allows a retry", async () => {
        setup.startReviewStep.execute.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params(REQUEST("start")));

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.onDone).not.toHaveBeenCalled();

        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("uses the step name as the title after the review was cancelled underneath", async () => {
        setup.approveReviewStep.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Conflict.", code: ReviewErrorCode.InvalidState })
        );
        await setup.presenter.init(setup.params(REQUEST("approve")));
        setup.getReview.execute.mockResolvedValue(
            createReviewWithFlags(
                createReview({ state: "cancelled", isActive: false, steps: inReviewReview().steps })
            )
        );

        await setup.presenter.submit();

        expect(setup.presenter.vm.title).toBe("Legal sign-off");
    });

    describe("TargetSync (R266)", () => {
        const targetSync = () => {
            return new GraphQLOperationError({
                message: "The review was saved, but updating its content failed.",
                code: ReviewErrorCode.TargetSync,
                data: { review: {}, cause: "Sync failed." }
            });
        };

        it("treats TargetSync as a success for start, take over, reject and cancel", async () => {
            const start = createSetup();
            start.startReviewStep.execute.mockRejectedValue(targetSync());
            await start.presenter.init(start.params(REQUEST("start")));
            await start.presenter.submit();
            expect(start.toasts.show).toHaveBeenCalledWith({
                kind: "started",
                stepTitle: "Legal sign-off",
                personName: null,
                reviewsUrl: "/cms/content-reviews",
                contentNotUpdated: true
            });

            const takeOver = createSetup();
            takeOver.takeOverReviewStep.execute.mockRejectedValue(targetSync());
            await takeOver.presenter.init(takeOver.params(REQUEST("takeOver")));
            await takeOver.presenter.submit();
            expect(takeOver.toasts.show).toHaveBeenCalledWith({
                kind: "tookOver",
                stepTitle: "Legal sign-off",
                personName: "Luka Perić",
                reviewsUrl: "/cms/content-reviews",
                contentNotUpdated: true
            });

            const reject = createSetup();
            reject.rejectReviewStep.execute.mockRejectedValue(targetSync());
            await reject.presenter.init(reject.params(REQUEST("reject")));
            reject.presenter.setComment("Missing the disclaimer.");
            await reject.presenter.submit();
            expect(reject.toasts.show).toHaveBeenCalledWith({
                kind: "rejected",
                stepTitle: "Legal sign-off",
                personName: null,
                reviewsUrl: "/cms/content-reviews",
                contentNotUpdated: true
            });

            const cancel = createSetup();
            cancel.cancelReview.execute.mockRejectedValue(targetSync());
            await cancel.presenter.init(
                cancel.params({ kind: "cancel", reviewId: "review-1", stepId: null })
            );
            await cancel.presenter.submit();
            expect(cancel.toasts.show).toHaveBeenCalledWith({
                kind: "cancelled",
                stepTitle: null,
                personName: null,
                reviewsUrl: "/cms/content-reviews",
                contentNotUpdated: true
            });

            for (const done of [start, takeOver, reject, cancel]) {
                expect(done.onDone).toHaveBeenCalledTimes(1);
                expect(done.presenter.vm.dialogError).toBeNull();
                expect(done.presenter.vm.conflict).toBeNull();
                expect(done.presenter.vm.submitting).toBe(false);
            }
        });

        it("treats TargetSync as a success for approve, with the next step from a re-read", async () => {
            setup.approveReviewStep.execute.mockRejectedValue(targetSync());
            await setup.presenter.init(setup.params(REQUEST("approve")));
            setup.getReview.execute.mockResolvedValue(
                createReviewWithFlags(
                    createReview({
                        currentStepId: "step-2",
                        steps: [
                            createStep({
                                id: "step-1",
                                title: "Legal sign-off",
                                state: StepState.Approved
                            }),
                            createStep({
                                id: "step-2",
                                title: "Legal check",
                                state: StepState.Awaiting
                            })
                        ]
                    }),
                    createFlags()
                )
            );

            await setup.presenter.submit();

            expect(setup.getReview.execute).toHaveBeenCalledTimes(2);
            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "approved",
                stepTitle: "Legal sign-off",
                personName: null,
                nextStepTitle: "Legal check",
                reviewsUrl: "/cms/content-reviews",
                contentNotUpdated: true
            });
            expect(setup.onDone).toHaveBeenCalledTimes(1);
            expect(setup.presenter.vm.dialogError).toBeNull();
        });

        it("names the next step in order when the re-read after an approve fails", async () => {
            const review = createReview({
                currentStepId: "step-1",
                currentStepState: StepState.InReview,
                steps: [
                    createStep({
                        id: "step-1",
                        title: "Legal sign-off",
                        state: StepState.InReview,
                        owner: LUKA
                    }),
                    createStep({ id: "step-2", title: "Legal check", state: StepState.Awaiting })
                ]
            });
            setup.getReview.execute.mockResolvedValueOnce(
                createReviewWithFlags(review, createFlags())
            );
            setup.getReview.execute.mockRejectedValueOnce(new Error("Network down."));
            setup.approveReviewStep.execute.mockRejectedValue(targetSync());
            await setup.presenter.init(setup.params(REQUEST("approve")));

            await setup.presenter.submit();

            expect(setup.toasts.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    kind: "approved",
                    nextStepTitle: "Legal check",
                    contentNotUpdated: true
                })
            );
            expect(setup.onDone).toHaveBeenCalledTimes(1);
        });
    });

    describe("restart (R266)", () => {
        beforeEach(() => {
            setup.getReview.execute.mockResolvedValue(
                createReviewWithFlags(failedReview(), createFlags({ canRestart: true }))
            );
        });

        it("builds the restart copy from the failed attempt", async () => {
            await setup.presenter.init(setup.params(REQUEST("restart")));

            const { vm } = setup.presenter;
            expect(vm.status).toBe("ready");
            expect(vm.title).toBe("Restart “AI tone check”?");
            expect(vm.body).toBe(
                "Last attempt failed at 10:20: Provider unavailable: request timed out after 60 s. Restarting runs the step again from the beginning."
            );
            expect(vm.confirmLabel).toBe("Restart");
            expect(vm.cancelLabel).toBe("Cancel");
            expect(vm.showComment).toBe(false);
            expect(vm.canSubmit).toBe(true);
        });

        it("calls restartStep, shows the restarted toast and calls onDone", async () => {
            await setup.presenter.init(setup.params(REQUEST("restart")));

            await setup.presenter.submit();

            expect(setup.restartReviewStep.execute).toHaveBeenCalledTimes(1);
            expect(setup.restartReviewStep.execute).toHaveBeenCalledWith({
                namespace: "cms.article",
                reviewId: "review-1",
                stepId: "step-1"
            });
            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: "/cms/content-reviews"
            });
            expect(setup.onDone).toHaveBeenCalledTimes(1);
            expect(setup.presenter.vm.dialogError).toBeNull();
        });

        it("passes a null reviews URL through for Content Reviews (no link)", async () => {
            await setup.presenter.init({ ...setup.params(REQUEST("restart")), reviewsUrl: null });

            await setup.presenter.submit();

            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: null
            });
        });

        it("treats TargetSync as a success: the toast with the warning and onDone, no error, no re-read", async () => {
            setup.restartReviewStep.execute.mockRejectedValue(
                new GraphQLOperationError({
                    message: "The review was saved, but updating its content failed.",
                    code: ReviewErrorCode.TargetSync
                })
            );
            await setup.presenter.init(setup.params(REQUEST("restart")));

            await setup.presenter.submit();

            expect(setup.toasts.show).toHaveBeenCalledWith({
                kind: "restarted",
                stepTitle: "AI tone check",
                personName: null,
                reviewsUrl: "/cms/content-reviews",
                contentNotUpdated: true
            });
            expect(setup.onDone).toHaveBeenCalledTimes(1);
            expect(setup.presenter.vm.dialogError).toBeNull();
            expect(setup.presenter.vm.conflict).toBeNull();
            expect(setup.getReview.execute).toHaveBeenCalledTimes(1);
        });

        it("keeps the dialog open with the restart conflict when the step is running again", async () => {
            setup.restartReviewStep.execute.mockRejectedValue(
                new GraphQLOperationError({
                    message: "Conflict.",
                    code: ReviewErrorCode.InvalidState
                })
            );
            setup.getReview.execute
                .mockResolvedValueOnce(
                    createReviewWithFlags(failedReview(), createFlags({ canRestart: true }))
                )
                .mockResolvedValueOnce(createReviewWithFlags(runningAgainReview(), createFlags()));
            await setup.presenter.init(setup.params(REQUEST("restart")));

            await setup.presenter.submit();

            const conflict = setup.presenter.vm.conflict;
            expect(conflict?.title).toBe("Someone else acted first");
            expect(conflict?.message).toMatch(
                /^Someone restarted “AI tone check” at .+\. It is running again, so your restart was not saved\.$/
            );
            expect(setup.toasts.show).not.toHaveBeenCalled();
            expect(setup.onDone).not.toHaveBeenCalled();
        });

        it("appends the list note to the restart conflict on Content Reviews (R220)", async () => {
            setup.restartReviewStep.execute.mockRejectedValue(
                new GraphQLOperationError({
                    message: "Conflict.",
                    code: ReviewErrorCode.StepNotCurrent
                })
            );
            setup.getReview.execute
                .mockResolvedValueOnce(
                    createReviewWithFlags(failedReview(), createFlags({ canRestart: true }))
                )
                .mockResolvedValueOnce(createReviewWithFlags(runningAgainReview(), createFlags()));
            await setup.presenter.init({
                ...setup.params(REQUEST("restart")),
                listRefreshed: true
            });

            await setup.presenter.submit();

            expect(setup.presenter.vm.conflict?.message).toMatch(
                /so your restart was not saved\. The list has been refreshed\.$/
            );
        });

        it("fails the load when the request names a step the review does not have", async () => {
            await setup.presenter.init(
                setup.params({ kind: "restart", reviewId: "review-1", stepId: "missing" })
            );

            expect(setup.presenter.vm.status).toBe("failed");
            expect(setup.presenter.vm.confirmLabel).toBe("");
        });
    });

    it("shows the running suffix in the cancel dialog of a running AI step (frame 23)", async () => {
        setup.getReview.execute.mockResolvedValue(
            createReviewWithFlags(runningAgainReview(), createFlags({ canCancel: true }))
        );

        await setup.presenter.init(
            setup.params({ kind: "cancel", reviewId: "review-1", stepId: null })
        );

        expect(setup.presenter.vm.body).toBe(
            "Review progress is lost. Editing is unlocked, and a new request starts again from the first step. AI tone check is running and will be stopped."
        );
    });

    it("calls onClose on dismiss", async () => {
        await setup.presenter.init(setup.params(REQUEST("approve")));

        setup.presenter.dismiss();

        expect(setup.onClose).toHaveBeenCalledTimes(1);
    });

    it("resets on dispose and is transient", async () => {
        await setup.presenter.init(setup.params(REQUEST("reject")));
        setup.presenter.setComment("Some comment here.");

        setup.presenter.dispose();

        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.vm.comment).toBe("");
        expect(setup.presenter.vm.title).toBe("");

        const { presenter: other } = ReviewActionDialogPresenterFeature.resolve(setup.container);
        expect(other).not.toBe(setup.presenter);
    });
});
