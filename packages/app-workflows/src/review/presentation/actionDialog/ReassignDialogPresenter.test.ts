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
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenterFeature } from "../reviewerPicker/feature.js";
import { ReassignDialogPresenterFeature } from "./reassignFeature.js";
import type { ReassignDialogInitParams } from "./reassignAbstractions.js";
import { createActor } from "~/review/testing/createActor.js";
import { createFakeUseCases } from "~/review/testing/fakeReviewUseCases.js";
import { createFlags } from "~/review/testing/createFlags.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createStep } from "~/review/testing/createStep.js";
import type { FakeReviewUseCases } from "~/review/testing/fakeReviewUseCases.js";

const LUKA = createActor({ id: "user-2", displayName: "Luka Perić" });

const CANDIDATES: StepCandidate[] = [
    { id: "user-2", displayName: "Luka Perić", excluded: false, excludedReason: null },
    { id: "user-3", displayName: "Ivan Horvat", excluded: false, excludedReason: null },
    { id: "user-4", displayName: "Petra Novak", excluded: true, excludedReason: null }
];

interface Setup {
    presenter: ReturnType<typeof ReassignDialogPresenterFeature.resolve>["presenter"];
    useCases: FakeReviewUseCases;
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: () => ReassignDialogInitParams;
}

const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    ReassignDialogPresenterFeature.register(container);
    const { presenter } = ReassignDialogPresenterFeature.resolve(container);
    const useCases = createFakeUseCases();
    const step = createStep({
        id: "step-1",
        title: "Legal sign-off",
        state: StepState.InReview,
        owner: LUKA
    });
    const review = createReview({ currentStepId: "step-1", steps: [step] });
    const flags = createFlags({ canReassign: true });
    useCases.getReview.mockResolvedValue(createReviewWithFlags(review, flags));
    useCases.listReviewStepCandidates.mockResolvedValue(CANDIDATES);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        useCases,
        toasts,
        onDone,
        onClose,
        params: () => ({
            useCases,
            request: { kind: "reassign", reviewId: "review-1", stepId: "step-1" },
            reviewsUrl: "/cms/content-reviews",
            onDone,
            onClose
        })
    };
};

describe("ReassignDialogPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the review by id, then the candidates of the step (R230, R234)", async () => {
        const pending = setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("loading");

        await pending;

        expect(setup.useCases.getReview).toHaveBeenCalledWith("review-1");
        expect(setup.useCases.listReviewStepCandidates).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1"
        });
        const { vm } = setup.presenter;
        expect(vm.status).toBe("ready");
        expect(vm.title).toBe("Reassign “Legal sign-off”");
        expect(vm.hint).toBe("The previous owner (if any) and the new owner are notified.");
        expect(vm.confirmLabel).toBe("Reassign");
        expect(vm.cancelLabel).toBe("Cancel");
        expect(vm.nobodyEligible).toBe(false);
    });

    it("marks the current owner and excluded people disabled in the private picker", async () => {
        await setup.presenter.init(setup.params());

        const picker = setup.presenter.getPickerPresenter();
        expect(picker.vm.options).toEqual([
            { label: "Luka Perić (Current owner)", value: "user-2", disabled: true },
            { label: "Ivan Horvat", value: "user-3", disabled: false },
            { label: "Petra Novak (Unavailable)", value: "user-4", disabled: true }
        ]);
    });

    it("keeps the confirm disabled until a person is chosen", async () => {
        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.canSubmit).toBe(false);

        setup.presenter.getPickerPresenter().select("user-3");

        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("shows only the message and Close when nobody is eligible (QBZ-34)", async () => {
        setup.useCases.listReviewStepCandidates.mockResolvedValue([
            { id: "user-2", displayName: "Luka Perić", excluded: false, excludedReason: null }
        ]);

        await setup.presenter.init(setup.params());

        const { vm } = setup.presenter;
        expect(vm.nobodyEligible).toBe(true);
        expect(vm.message).toBe("Nobody else is eligible to review this step.");
        expect(vm.hint).toBe("");
        expect(vm.cancelLabel).toBe("Close");
        expect(vm.canSubmit).toBe(false);
    });

    it("reassigns, shows the toast with the new owner's name and calls onDone", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        expect(setup.useCases.reassignStep).toHaveBeenCalledWith({
            reviewId: "review-1",
            stepId: "step-1",
            userId: "user-3"
        });
        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "reassigned",
            stepTitle: "Legal sign-off",
            personName: "Ivan Horvat",
            reviewsUrl: "/cms/content-reviews"
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("collapses to Close on a conflict and names who acted (R220)", async () => {
        setup.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotReassignable
            })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        const { vm } = setup.presenter;
        expect(vm.conflict?.title).toBe("Someone else acted first");
        expect(vm.cancelLabel).toBe("Close");
        expect(vm.canSubmit).toBe(false);
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
        expect(setup.toasts.show).not.toHaveBeenCalled();
    });

    it("calls onConflict once after the re-read, on a conflict only (F1)", async () => {
        const onConflict = vi.fn();
        setup.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotReassignable
            })
        );
        await setup.presenter.init({ ...setup.params(), onConflict });
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        expect(onConflict).toHaveBeenCalledTimes(1);
        expect(setup.useCases.getReview).toHaveBeenCalledTimes(2);
    });

    it("does not call onConflict on success or on other errors (F1)", async () => {
        const onConflict = vi.fn();
        await setup.presenter.init({ ...setup.params(), onConflict });
        setup.presenter.getPickerPresenter().select("user-3");
        await setup.presenter.submit();

        const other = createSetup();
        other.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await other.presenter.init({ ...other.params(), onConflict });
        other.presenter.getPickerPresenter().select("user-3");
        await other.presenter.submit();

        expect(onConflict).not.toHaveBeenCalled();
    });

    it("ends the conflict with the list note when listRefreshed (R220)", async () => {
        setup.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({
                message: "Conflict.",
                code: ReviewErrorCode.StepNotReassignable
            })
        );
        await setup.presenter.init({ ...setup.params(), listRefreshed: true });
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        expect(setup.presenter.vm.conflict?.message).toMatch(/The list has been refreshed\.$/);
    });

    it("maps an initial NotAuthorized or NotFound read to the same messages as submit (F3)", async () => {
        setup.useCases.getReview.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);

        const missing = createSetup();
        missing.useCases.getReview.mockRejectedValue(
            new GraphQLOperationError({ message: "Gone.", code: ReviewErrorCode.NotFound })
        );
        await missing.presenter.init(missing.params());
        expect(missing.presenter.vm.dialogError).toBe("This review no longer exists.");
    });

    it("shows a Validation message as the field error and a transport error as the dialog error", async () => {
        setup.useCases.reassignStep.mockRejectedValueOnce(
            new GraphQLOperationError({
                message: "Pick someone else.",
                code: ReviewErrorCode.Validation
            })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();
        expect(setup.presenter.vm.fieldError).toBe("Pick someone else.");

        setup.useCases.reassignStep.mockRejectedValueOnce(
            new GraphQLOperationError({
                message: "This content is locked by another review.",
                code: ReviewErrorCode.TargetLocked
            })
        );
        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBe("This content is locked by another review.");

        setup.useCases.reassignStep.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.presenter.vm.fieldError).toBeNull();
        expect(setup.onDone).not.toHaveBeenCalled();
    });

    it("keeps the picker shown while a Retry is loading", async () => {
        setup.useCases.listReviewStepCandidates.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        expect(setup.presenter.vm.showPicker).toBe(true);

        let release: (value: StepCandidate[]) => void = () => undefined;
        setup.useCases.listReviewStepCandidates.mockReturnValue(
            new Promise<StepCandidate[]>(resolve => {
                release = resolve;
            })
        );
        const pending = setup.presenter.getPickerPresenter().retry();

        expect(setup.presenter.vm.nobodyEligible).toBe(false);
        expect(setup.presenter.vm.showPicker).toBe(true);
        expect(setup.presenter.vm.closeOnly).toBe(false);

        release(CANDIDATES);
        await pending;
        expect(setup.presenter.vm.nobodyEligible).toBe(false);
    });

    it("names the chosen person in the toast even when a later search hides them", async () => {
        await setup.presenter.init(setup.params());
        const picker = setup.presenter.getPickerPresenter();
        picker.select("user-3");
        picker.search("petra");
        expect(picker.vm.options.map(option => option.value)).toEqual(["user-4"]);

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith(
            expect.objectContaining({ kind: "reassigned", personName: "Ivan Horvat" })
        );
    });

    it("fails the load with a dialog error", async () => {
        setup.useCases.getReview.mockRejectedValue(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.presenter.vm.cancelLabel).toBe("Close");
    });

    it("fails the load when the named step is not in the review (R244, no invented title)", async () => {
        await setup.presenter.init({
            ...setup.params(),
            request: { kind: "reassign", reviewId: "review-1", stepId: "step-unknown" }
        });

        expect(setup.presenter.vm.status).toBe("failed");
        expect(setup.useCases.listReviewStepCandidates).not.toHaveBeenCalled();
        expect(setup.presenter.vm.cancelLabel).toBe("Close");
    });

    it("keeps the dialog open while submitting", async () => {
        let release: () => void = () => undefined;
        setup.useCases.reassignStep.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve(createReview());
            })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        const pending = setup.presenter.submit();
        setup.presenter.dismiss();
        expect(setup.onClose).not.toHaveBeenCalled();

        release();
        await pending;
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("shows the shared no-access message for NotAuthorized", async () => {
        setup.useCases.reassignStep.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);
    });

    it("calls onClose on dismiss and resets on dispose", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.getPickerPresenter().select("user-3");

        setup.presenter.dismiss();
        expect(setup.onClose).toHaveBeenCalledTimes(1);

        setup.presenter.dispose();
        expect(setup.presenter.vm.status).toBe("loading");
        expect(setup.presenter.getPickerPresenter().vm.value).toBeNull();
    });
});
