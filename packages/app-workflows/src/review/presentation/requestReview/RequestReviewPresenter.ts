import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { REVIEW_TITLE_MIN_LENGTH } from "~/review/domain/constants.js";
import { GetBoundWorkflowUseCase } from "~/review/useCases/getBoundWorkflow/abstractions.js";
import { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import { ReviewerPickerFactory } from "../reviewerPicker/ReviewerPickerFactory.js";
import { classifyReviewActionError } from "../actionDialog/classifyReviewActionError.js";
import { getActionErrorMessage } from "../actionDialog/getActionErrorMessage.js";
import { RequestReviewPresenter as Abstraction } from "./abstractions.js";
import type { RequestReviewConflictVm } from "./abstractions.js";
import type { RequestReviewInitParams } from "./abstractions.js";
import type { RequestReviewMode } from "./abstractions.js";
import type { RequestReviewStepVm } from "./abstractions.js";
import { getStepTypeLabel } from "./getStepTypeLabel.js";
import type { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";

const SHORT_TITLE = "Use at least 5 characters.";

type Status = "loadingSteps" | "stepsFailed" | "ready" | "submitting";

const getLabelTag = (type: string, assignedAutomatically: boolean): string => {
    if (type === "ai" || type === "automation") {
        return getStepTypeLabel(type);
    }
    if (assignedAutomatically) {
        return "Assigned automatically";
    }
    return "Team pool";
};

class RequestReviewPresenterImpl implements Abstraction.Interface {
    private params: RequestReviewInitParams | null = null;
    private workflow: ReviewWorkflow | null = null;
    private pickers = new Map<string, ReviewerPickerPresenter.Interface>();
    private modes: Record<string, RequestReviewMode> = {};
    private title = "";
    private serverTitleError: string | null = null;
    private status: Status = "loadingSteps";
    private dialogError: string | null = null;
    private conflict: RequestReviewConflictVm | null = null;
    private token = 0;

    constructor(
        private getBoundWorkflowUseCase: GetBoundWorkflowUseCase.Interface,
        private listStepCandidatesUseCase: ListStepCandidatesUseCase.Interface,
        private requestReviewUseCase: RequestReviewUseCase.Interface,
        private pickerFactory: ReviewerPickerFactory.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            RequestReviewPresenterImpl,
            | "getBoundWorkflowUseCase"
            | "listStepCandidatesUseCase"
            | "requestReviewUseCase"
            | "pickerFactory"
            | "toasts"
            | "token"
            | "params"
            | "workflow"
            | "pickers"
            | "modes"
        >(this, {
            getBoundWorkflowUseCase: false,
            listStepCandidatesUseCase: false,
            requestReviewUseCase: false,
            pickerFactory: false,
            toasts: false,
            token: false,
            params: observableRef,
            workflow: observableRef,
            pickers: observableRef,
            modes: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const workflow = this.workflow;
        const steps: RequestReviewStepVm[] = [];

        // The steps stay hidden until the candidates are loaded, so no input is taken early.
        const visible = this.status === "ready" || this.status === "submitting";
        if (workflow && visible) {
            workflow.steps.forEach((step, index) => {
                const picker = this.pickers.get(step.id);
                const typeLabel = getStepTypeLabel(step.type);
                const labelTag = getLabelTag(step.type, step.assignedAutomatically);
                const noCandidates =
                    picker !== undefined &&
                    !picker.vm.loading &&
                    picker.vm.error === null &&
                    picker.vm.eligibleCount === 0;
                steps.push({
                    stepId: step.id,
                    index: index + 1,
                    title: step.title,
                    color: step.color,
                    typeLabel,
                    labelTag,
                    description: step.description,
                    allowManualPick: step.allowManualPick,
                    mode: this.modes[step.id] ?? "automatic",
                    hasPicker: picker !== undefined,
                    noCandidates
                });
            });
        }

        const trimmed = this.title.trim();
        let titleError = this.serverTitleError;
        if (titleError === null && trimmed.length < REVIEW_TITLE_MIN_LENGTH) {
            titleError = SHORT_TITLE;
        }

        const pickMissing = steps.some(step => {
            if (step.mode !== "pick") {
                return false;
            }
            const picker = this.pickers.get(step.stepId);
            return picker === undefined || picker.vm.value === null;
        });

        return {
            status: this.status,
            title: this.title,
            titleError,
            steps,
            dialogError: this.dialogError,
            conflict: this.conflict,
            canSubmit:
                this.status === "ready" &&
                this.conflict === null &&
                trimmed.length >= REVIEW_TITLE_MIN_LENGTH &&
                !pickMissing
        };
    }

    async init(params: RequestReviewInitParams): Promise<void> {
        const token = this.begin(params);

        try {
            const workflow = await this.getBoundWorkflowUseCase.execute({
                namespace: params.target.namespace
            });
            if (token !== this.token) {
                return;
            }
            if (workflow === null || workflow.steps.length === 0) {
                this.applyStepsFailed();
                return;
            }

            const created = new Map<string, ReviewerPickerPresenter.Interface>();
            for (const step of workflow.steps) {
                if (step.allowManualPick) {
                    const picker = this.pickerFactory.create();
                    created.set(step.id, picker);
                }
            }
            const entries = Array.from(created.entries());
            const loads = entries.map(([stepId, picker]) => {
                return picker.init({
                    load: () =>
                        this.listStepCandidatesUseCase.execute({
                            workflowId: workflow.id,
                            stepId,
                            target: params.target
                        }),
                    currentOwnerId: null,
                    selectedId: null
                });
            });
            await Promise.all(loads);
            if (token !== this.token) {
                return;
            }
            this.applyReady(workflow, created);
        } catch {
            if (token !== this.token) {
                return;
            }
            this.applyStepsFailed();
        }
    }

    setTitle(title: string): void {
        this.title = title;
        this.serverTitleError = null;
    }

    setMode(stepId: string, mode: RequestReviewMode): void {
        if (this.status !== "ready") {
            return;
        }
        const step = this.vm.steps.find(item => item.stepId === stepId);
        if (!step || !step.allowManualPick) {
            return;
        }
        if (mode === "pick" && step.noCandidates) {
            return;
        }
        this.modes = { ...this.modes, [stepId]: mode };
    }

    getPickerPresenter(stepId: string): ReviewerPickerPresenter.Interface | null {
        return this.pickers.get(stepId) ?? null;
    }

    async retrySteps(): Promise<void> {
        if (!this.params) {
            return;
        }
        await this.init({ ...this.params, targetTitle: this.title });
    }

    async submit(): Promise<void> {
        const params = this.params;
        const workflow = this.workflow;
        if (!params || !workflow || !this.vm.canSubmit) {
            return;
        }

        const picks: RequestReviewUseCase.Params["picks"] = [];
        this.vm.steps.forEach(step => {
            const picker = this.pickers.get(step.stepId);
            const userId = picker ? picker.vm.value : null;
            if (step.mode === "pick" && userId !== null) {
                picks.push({ stepId: step.stepId, userId });
            }
        });
        const firstStepTitle = workflow.steps[0].title;
        const token = this.token;

        this.startSubmit();

        try {
            await this.requestReviewUseCase.execute({
                target: params.target,
                title: this.title.trim(),
                picks
            });
        } catch (error) {
            if (token !== this.token) {
                return;
            }

            const errorKind = classifyReviewActionError(error);

            if (errorKind === "conflict") {
                this.applyConflict();
                if (params.onConflict) {
                    params.onConflict();
                }
                return;
            }
            if (errorKind === "validation" && error instanceof GraphQLOperationError) {
                this.applyTitleError(error.message);
                return;
            }
            this.applyDialogError(getActionErrorMessage(errorKind, error));
            return;
        }

        if (token !== this.token) {
            return;
        }

        this.toasts.show({
            kind: "requested",
            stepTitle: firstStepTitle,
            personName: null,
            reviewsUrl: params.reviewsUrl
        });
        this.finishSubmit();
        params.onDone();
    }

    dismiss(): void {
        // A dialog that is submitting stays open: closing it would lose the success path.
        if (this.params && this.status !== "submitting") {
            this.params.onClose();
        }
    }

    dispose(): void {
        this.token += 1;
        this.pickers.forEach(picker => picker.dispose());
        this.params = null;
        this.workflow = null;
        this.pickers = new Map();
        this.modes = {};
        this.title = "";
        this.serverTitleError = null;
        this.status = "loadingSteps";
        this.dialogError = null;
        this.conflict = null;
    }

    private begin(params: RequestReviewInitParams): number {
        this.token += 1;
        this.pickers.forEach(picker => picker.dispose());
        this.params = params;
        this.workflow = null;
        this.pickers = new Map();
        this.modes = {};
        this.title = params.targetTitle;
        this.serverTitleError = null;
        this.status = "loadingSteps";
        this.dialogError = null;
        this.conflict = null;
        return this.token;
    }

    private applyReady(
        workflow: ReviewWorkflow,
        pickers: Map<string, ReviewerPickerPresenter.Interface>
    ): void {
        this.workflow = workflow;
        this.pickers = pickers;
        this.status = "ready";
    }

    private applyStepsFailed(): void {
        this.status = "stepsFailed";
    }

    private startSubmit(): void {
        this.status = "submitting";
        this.dialogError = null;
        this.serverTitleError = null;
    }

    private finishSubmit(): void {
        this.status = "ready";
    }

    private applyConflict(): void {
        this.status = "ready";
        this.conflict = {
            title: "Someone else acted first",
            message: "Someone else already requested a review for this revision."
        };
    }

    private applyTitleError(message: string): void {
        this.status = "ready";
        this.serverTitleError = message;
    }

    private applyDialogError(message: string): void {
        this.status = "ready";
        this.dialogError = message;
    }
}

export const RequestReviewPresenter = Abstraction.createImplementation({
    implementation: RequestReviewPresenterImpl,
    dependencies: [
        GetBoundWorkflowUseCase,
        ListStepCandidatesUseCase,
        RequestReviewUseCase,
        ReviewerPickerFactory,
        ReviewToasts
    ]
});
