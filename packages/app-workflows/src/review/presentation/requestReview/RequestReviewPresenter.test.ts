import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenterFeature } from "../reviewerPicker/feature.js";
import { RequestReviewPresenterFeature } from "./feature.js";
import type { RequestReviewInitParams } from "./abstractions.js";
import { TARGET } from "~/review/testing/reviewTarget.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";

const WORKFLOW: ReviewWorkflow = createWorkflow({
    steps: [
        {
            id: "editorial",
            title: "Editorial check",
            color: "#FA5723",
            description: "Reads the copy.",
            type: "review",
            allowManualPick: true,
            assignedAutomatically: false
        },
        {
            id: "legal",
            title: "Legal sign-off",
            color: "#0D9488",
            description: null,
            type: "review",
            allowManualPick: true,
            assignedAutomatically: true
        },
        {
            id: "tone",
            title: "AI tone check",
            color: "#7C3AED",
            description: null,
            type: "ai",
            allowManualPick: false,
            assignedAutomatically: false
        },
        {
            id: "hook",
            title: "Notify web team",
            color: "#2563EB",
            description: null,
            type: "automation",
            allowManualPick: false,
            assignedAutomatically: false
        }
    ]
});

const PEOPLE: StepCandidate[] = [
    { id: "u1", displayName: "Ivan Horvat", teamNames: [], excluded: false, excludedReason: null },
    { id: "u2", displayName: "Luka Perić", teamNames: [], excluded: false, excludedReason: null }
];

interface GetBoundWorkflowFake {
    execute: Mock<GetBoundWorkflowUseCase.Interface["execute"]>;
}

interface ListStepCandidatesFake {
    execute: Mock<ListStepCandidatesUseCase.Interface["execute"]>;
}

interface RequestReviewFake {
    execute: Mock<RequestReviewUseCase.Interface["execute"]>;
}

interface Setup {
    presenter: ReturnType<typeof RequestReviewPresenterFeature.resolve>["presenter"];
    getBoundWorkflow: GetBoundWorkflowFake;
    listStepCandidates: ListStepCandidatesFake;
    requestReview: RequestReviewFake;
    toasts: { show: ReturnType<typeof vi.fn> };
    onDone: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
    params: (overrides?: Partial<RequestReviewInitParams>) => RequestReviewInitParams;
}

// One fake per injected use case (R355).
const createSetup = (): Setup => {
    const container = new Container();
    const toasts = { show: vi.fn() };
    const review = createReview();
    const getBoundWorkflow = {
        execute: vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>().mockResolvedValue(WORKFLOW)
    };
    const listStepCandidates = {
        execute: vi.fn<ListStepCandidatesUseCase.Interface["execute"]>().mockResolvedValue(PEOPLE)
    };
    const requestReview = {
        execute: vi.fn<RequestReviewUseCase.Interface["execute"]>().mockResolvedValue(review)
    };
    container.registerInstance(GetBoundWorkflowUseCase, getBoundWorkflow);
    container.registerInstance(ListStepCandidatesUseCase, listStepCandidates);
    container.registerInstance(RequestReviewUseCase, requestReview);
    container.registerInstance(ReviewToasts, toasts);
    ReviewerPickerPresenterFeature.register(container);
    RequestReviewPresenterFeature.register(container);
    const { presenter } = RequestReviewPresenterFeature.resolve(container);
    const onDone = vi.fn();
    const onClose = vi.fn();
    return {
        presenter,
        getBoundWorkflow,
        listStepCandidates,
        requestReview,
        toasts,
        onDone,
        onClose,
        params: (overrides = {}) => ({
            target: TARGET,
            targetTitle: "Spring campaign",
            reviewsUrl: "/cms/content-reviews",
            onDone,
            onClose,
            ...overrides
        })
    };
};

describe("RequestReviewPresenter", () => {
    let setup: Setup;

    beforeEach(() => {
        setup = createSetup();
    });

    it("loads the steps and is loadingSteps before that (QBZ-6)", async () => {
        const pending = setup.presenter.init(setup.params());
        expect(setup.presenter.vm.status).toBe("loadingSteps");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        await pending;

        expect(setup.getBoundWorkflow.execute).toHaveBeenCalledWith({
            namespace: TARGET.namespace
        });
        expect(setup.presenter.vm.status).toBe("ready");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("keeps the steps hidden and ignores setMode until the candidates are loaded", async () => {
        let release: (people: StepCandidate[]) => void = () => undefined;
        setup.listStepCandidates.execute.mockReturnValue(
            new Promise<StepCandidate[]>(resolve => {
                release = resolve;
            })
        );

        const pending = setup.presenter.init(setup.params());
        await vi.waitFor(() => expect(setup.listStepCandidates.execute).toHaveBeenCalled());

        expect(setup.presenter.vm.status).toBe("loadingSteps");
        expect(setup.presenter.vm.steps).toEqual([]);
        setup.presenter.setMode("editorial", "pick");

        release([
            {
                id: "u1",
                displayName: "Ivan Horvat",
                teamNames: [],
                excluded: true,
                excludedReason: null
            }
        ]);
        await pending;

        expect(setup.presenter.vm.steps[0].mode).toBe("automatic");
        expect(setup.presenter.vm.steps[0].noCandidates).toBe(true);
    });

    it("prefills the title with the content title", async () => {
        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.title).toBe("Spring campaign");
        expect(setup.presenter.vm.titleError).toBeNull();
    });

    it("describes each step with number, colour, type and label tags (R218)", async () => {
        await setup.presenter.init(setup.params());

        const steps = setup.presenter.vm.steps;
        expect(steps.map(step => [step.index, step.title, step.typeLabel, step.labelTag])).toEqual([
            [1, "Editorial check", "People", "Team pool"],
            [2, "Legal sign-off", "People", "Assigned automatically"],
            [3, "AI tone check", "AI", "AI"],
            [4, "Notify web team", "Automation", "Automation"]
        ]);
        expect(steps[0].color).toBe("#FA5723");
        expect(steps[0].description).toBe("Reads the copy.");
        expect(steps[2].description).toBeNull();
        expect(steps.map(step => step.allowManualPick)).toEqual([true, true, false, false]);
        expect(steps.map(step => step.mode)).toEqual([
            "automatic",
            "automatic",
            "automatic",
            "automatic"
        ]);
        expect(steps.map(step => step.hasPicker)).toEqual([true, true, false, false]);
    });

    it("loads candidates only for steps that allow picks", async () => {
        await setup.presenter.init(setup.params());

        expect(setup.listStepCandidates.execute).toHaveBeenCalledTimes(2);
        expect(setup.listStepCandidates.execute).toHaveBeenCalledWith({
            workflowId: "workflow-1",
            stepId: "editorial",
            target: TARGET
        });
        expect(setup.presenter.getPickerPresenter("tone")).toBeNull();
        expect(setup.presenter.getPickerPresenter("editorial")).not.toBeNull();
    });

    it("keeps one independent picker per pick step (QBZ-49)", async () => {
        await setup.presenter.init(setup.params());

        const first = setup.presenter.getPickerPresenter("editorial");
        const second = setup.presenter.getPickerPresenter("legal");
        expect(first).not.toBe(second);
        first?.select("u1");
        expect(second?.vm.value).toBeNull();
    });

    it("fails the steps with a retry (QBZ-6)", async () => {
        setup.getBoundWorkflow.execute.mockRejectedValueOnce(new Error("Network."));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("stepsFailed");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        await setup.presenter.retrySteps();

        expect(setup.presenter.vm.status).toBe("ready");
    });

    it("keeps an edited title across a steps retry", async () => {
        setup.getBoundWorkflow.execute.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());
        setup.presenter.setTitle("My own title");

        await setup.presenter.retrySteps();

        expect(setup.presenter.vm.title).toBe("My own title");
    });

    it("treats a workflow without steps as a steps failure", async () => {
        setup.getBoundWorkflow.execute.mockResolvedValue(createWorkflow({ steps: [] }));

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("stepsFailed");
    });

    it("keeps the dialog open while submitting, so the success path is not lost", async () => {
        let release: () => void = () => undefined;
        setup.requestReview.execute.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({} as never);
            })
        );
        await setup.presenter.init(setup.params());

        const pending = setup.presenter.submit();
        setup.presenter.dismiss();
        expect(setup.onClose).not.toHaveBeenCalled();

        release();
        await pending;
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("shows the shared no-access message for NotAuthorized", async () => {
        setup.requestReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(NO_ACCESS_MESSAGE);
    });

    it("treats a workflow that vanished as a steps failure", async () => {
        setup.getBoundWorkflow.execute.mockResolvedValue(null);

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.status).toBe("stepsFailed");
    });

    it("requires at least 5 characters after trim (R215, D100)", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.setTitle("  ab  ");
        expect(setup.presenter.vm.titleError).toBe("Use at least 5 characters.");
        expect(setup.presenter.vm.canSubmit).toBe(false);
        await setup.presenter.submit();
        expect(setup.requestReview.execute).not.toHaveBeenCalled();

        setup.presenter.setTitle("  abcde  ");
        expect(setup.presenter.vm.titleError).toBeNull();
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("needs a person for every pick step that is set to Choose a person (QBZ-49)", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.setMode("editorial", "pick");
        setup.presenter.setMode("legal", "pick");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        setup.presenter.getPickerPresenter("editorial")?.select("u1");
        expect(setup.presenter.vm.canSubmit).toBe(false);

        setup.presenter.getPickerPresenter("legal")?.select("u2");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("sends picks only for pick steps with a person chosen (Review Focus 14)", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.setMode("editorial", "pick");
        setup.presenter.getPickerPresenter("editorial")?.select("u1");
        setup.presenter.getPickerPresenter("legal")?.select("u2");
        setup.presenter.setTitle("  Spring campaign v2  ");

        await setup.presenter.submit();

        expect(setup.requestReview.execute).toHaveBeenCalledWith({
            target: TARGET,
            title: "Spring campaign v2",
            picks: [{ stepId: "editorial", userId: "u1" }]
        });
    });

    it("sends no picks when every step stays on Automatic", async () => {
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.requestReview.execute).toHaveBeenCalledWith({
            target: TARGET,
            title: "Spring campaign",
            picks: []
        });
    });

    it("drops a pick when the step goes back to Automatic", async () => {
        await setup.presenter.init(setup.params());
        setup.presenter.setMode("editorial", "pick");
        setup.presenter.getPickerPresenter("editorial")?.select("u1");
        setup.presenter.setMode("editorial", "automatic");

        await setup.presenter.submit();

        expect(setup.requestReview.execute.mock.calls[0][0].picks).toEqual([]);
    });

    it("disables Choose a person when nobody can be picked and keeps the step on Automatic (QBZ-48)", async () => {
        setup.listStepCandidates.execute.mockResolvedValue([
            {
                id: "u1",
                displayName: "Ivan Horvat",
                teamNames: [],
                excluded: true,
                excludedReason: null
            }
        ]);

        await setup.presenter.init(setup.params());

        expect(setup.presenter.vm.steps[0].noCandidates).toBe(true);
        setup.presenter.setMode("editorial", "pick");
        expect(setup.presenter.vm.steps[0].mode).toBe("automatic");
        expect(setup.presenter.vm.canSubmit).toBe(true);
    });

    it("ignores a mode change for a step that allows no picks", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.setMode("tone", "pick");

        expect(setup.presenter.vm.steps[2].mode).toBe("automatic");
    });

    it("shows the toast with the first step and calls onDone after success (QBZ-93)", async () => {
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "requested",
            stepTitle: "Editorial check",
            personName: null,
            reviewsUrl: "/cms/content-reviews",
            contentNotUpdated: false
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("treats TargetSync as a success: the toast with the warning and onDone, no error (R266)", async () => {
        setup.requestReview.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "The review was saved, but updating its content failed.",
                code: ReviewErrorCode.TargetSync,
                data: { review: {}, cause: "Sync failed." }
            })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.toasts.show).toHaveBeenCalledWith({
            kind: "requested",
            stepTitle: "Editorial check",
            personName: null,
            reviewsUrl: "/cms/content-reviews",
            contentNotUpdated: true
        });
        expect(setup.onDone).toHaveBeenCalledTimes(1);
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.presenter.vm.conflict).toBeNull();
        expect(setup.presenter.vm.status).toBe("ready");
    });

    it("does not submit twice while submitting", async () => {
        let release: () => void = () => undefined;
        setup.requestReview.execute.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({} as never);
            })
        );
        await setup.presenter.init(setup.params());

        const first = setup.presenter.submit();
        expect(setup.presenter.vm.status).toBe("submitting");
        const second = setup.presenter.submit();
        release();
        await first;
        await second;

        expect(setup.requestReview.execute).toHaveBeenCalledTimes(1);
    });

    it("shows 'Someone else acted first' and collapses on AlreadyActive", async () => {
        setup.requestReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Active.", code: ReviewErrorCode.AlreadyActive })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        const { vm } = setup.presenter;
        expect(vm.conflict).toEqual({
            title: "Someone else acted first",
            message: "Someone else already requested a review for this revision."
        });
        expect(vm.canSubmit).toBe(false);
        expect(setup.toasts.show).not.toHaveBeenCalled();
        expect(setup.onDone).not.toHaveBeenCalled();
    });

    it("calls onConflict once on AlreadyActive, and not on success or other errors (F1)", async () => {
        const onConflict = vi.fn();
        setup.requestReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "Active.", code: ReviewErrorCode.AlreadyActive })
        );
        await setup.presenter.init(setup.params({ onConflict }));
        await setup.presenter.submit();
        expect(onConflict).toHaveBeenCalledTimes(1);

        const other = createSetup();
        other.requestReview.execute.mockRejectedValue(
            new GraphQLOperationError({ message: "No.", code: ReviewErrorCode.NotAuthorized })
        );
        await other.presenter.init(other.params({ onConflict }));
        await other.presenter.submit();
        const ok = createSetup();
        await ok.presenter.init(ok.params({ onConflict }));
        await ok.presenter.submit();

        expect(onConflict).toHaveBeenCalledTimes(1);
    });

    it("shows a Validation error under the title and clears it on edit", async () => {
        setup.requestReview.execute.mockRejectedValue(
            new GraphQLOperationError({
                message: "Use 120 characters or fewer.",
                code: ReviewErrorCode.Validation
            })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();
        expect(setup.presenter.vm.titleError).toBe("Use 120 characters or fewer.");
        expect(setup.presenter.vm.status).toBe("ready");

        setup.presenter.setTitle("Spring campaign 2");
        expect(setup.presenter.vm.titleError).toBeNull();
    });

    it("shows the server message of a rejection that is not classified", async () => {
        setup.requestReview.execute.mockRejectedValueOnce(
            new GraphQLOperationError({
                message: "This content is locked by another review.",
                code: "Workflows/Review/TargetLocked"
            })
        );
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe("This content is locked by another review.");
        expect(setup.presenter.vm.status).toBe("ready");
    });

    it("shows the server-error alert and allows a retry", async () => {
        setup.requestReview.execute.mockRejectedValueOnce(new Error("Network."));
        await setup.presenter.init(setup.params());

        await setup.presenter.submit();

        expect(setup.presenter.vm.dialogError).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(setup.presenter.vm.status).toBe("ready");
        expect(setup.onDone).not.toHaveBeenCalled();

        await setup.presenter.submit();
        expect(setup.presenter.vm.dialogError).toBeNull();
        expect(setup.onDone).toHaveBeenCalledTimes(1);
    });

    it("calls onClose on dismiss and resets on dispose", async () => {
        await setup.presenter.init(setup.params());

        setup.presenter.dismiss();
        expect(setup.onClose).toHaveBeenCalledTimes(1);

        setup.presenter.dispose();
        expect(setup.presenter.vm.status).toBe("loadingSteps");
        expect(setup.presenter.vm.steps).toEqual([]);
        expect(setup.presenter.getPickerPresenter("editorial")).toBeNull();
    });
});
