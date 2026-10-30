import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewerPickerPresenter } from "../reviewerPicker/abstractions.js";
import { ReassignDialogPresenter as Abstraction } from "./reassignAbstractions.js";
import type { ReassignNobodyVm } from "./reassignAbstractions.js";
import type { ReassignDialogInitParams } from "./reassignAbstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";
import { getActionErrorMessage } from "./getActionErrorMessage.js";
import { getConflictMessage } from "./getConflictMessage.js";

const NOBODY = "Nobody else is eligible to review this step.";
const HINT = "The previous owner (if any) and the new owner are notified.";

class ReassignDialogPresenterImpl implements Abstraction.Interface {
    private params: ReassignDialogInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private candidates: StepCandidate[] = [];
    private status: "loading" | "ready" | "failed" = "loading";
    private submitting = false;
    private fieldError: string | null = null;
    private dialogError: string | null = null;
    private conflict: ReviewActionConflictVm | null = null;
    private token = 0;

    constructor(
        private getReviewUseCase: GetReviewUseCase.Interface,
        private listReviewStepCandidatesUseCase: ListReviewStepCandidatesUseCase.Interface,
        private reassignReviewStepUseCase: ReassignReviewStepUseCase.Interface,
        private picker: ReviewerPickerPresenter.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            ReassignDialogPresenterImpl,
            | "getReviewUseCase"
            | "listReviewStepCandidatesUseCase"
            | "reassignReviewStepUseCase"
            | "picker"
            | "toasts"
            | "token"
            | "params"
            | "review"
            | "candidates"
        >(this, {
            getReviewUseCase: false,
            listReviewStepCandidatesUseCase: false,
            reassignReviewStepUseCase: false,
            picker: false,
            toasts: false,
            token: false,
            params: observableRef,
            review: observableRef,
            candidates: false
        });
    }

    get vm(): Abstraction.ViewModel {
        const params = this.params;
        const review = this.review;
        const stepId = params ? params.request.stepId : null;
        const step = review ? review.review.steps.find(item => item.id === stepId) : undefined;
        const pickerVm = this.picker.vm;
        const ready = this.status === "ready";
        const nobodyEligible =
            ready && pickerVm.error === null && !pickerVm.loading && pickerVm.eligibleCount === 0;
        const closeOnly = nobodyEligible || this.conflict !== null || this.status === "failed";

        const showPicker = ready && !nobodyEligible && this.conflict === null;

        let title = "";
        if (step) {
            title = `Reassign “${step.title}”`;
        }
        let hint = "";
        if (ready && !nobodyEligible && this.conflict === null) {
            hint = HINT;
        }
        let nobody: ReassignNobodyVm | null = null;
        if (nobodyEligible) {
            let detail = `“${review ? review.review.title : ""}”`;
            if (step && step.owner !== null) {
                detail = `${detail} · currently ${step.owner.displayName}`;
            }
            nobody = { text: NOBODY, detail: `${detail}.` };
        }
        let cancelLabel = "Cancel";
        if (closeOnly) {
            cancelLabel = "Close";
        }
        const canSubmit =
            ready &&
            !nobodyEligible &&
            this.conflict === null &&
            !this.submitting &&
            pickerVm.value !== null;

        return {
            status: this.status,
            title,
            hint,
            nobody,
            nobodyEligible,
            showPicker,
            closeOnly,
            confirmLabel: "Reassign",
            cancelLabel,
            canSubmit,
            submitting: this.submitting,
            fieldError: this.fieldError,
            dialogError: this.dialogError,
            conflict: this.conflict
        };
    }

    getPickerPresenter(): ReviewerPickerPresenter.Interface {
        return this.picker;
    }

    async init(params: ReassignDialogInitParams): Promise<void> {
        const token = this.begin(params);
        const { namespace, request } = params;
        const stepId = request.stepId ?? "";

        try {
            const loaded = await this.getReviewUseCase.execute({
                namespace,
                reviewId: request.reviewId
            });
            if (token !== this.token) {
                return;
            }
            const step = loaded.review.steps.find(item => item.id === request.stepId);
            if (!step) {
                this.applyLoadFailure();
                return;
            }
            let currentOwnerId: string | null = null;
            if (step.owner !== null && step.owner.type === "user") {
                currentOwnerId = step.owner.id;
            }

            await this.picker.init({
                load: async () => {
                    const candidates = await this.listReviewStepCandidatesUseCase.execute({
                        namespace,
                        reviewId: request.reviewId,
                        stepId
                    });
                    if (token === this.token) {
                        this.candidates = candidates;
                    }
                    return candidates;
                },
                currentOwnerId,
                selectedId: null
            });
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
        } catch (error) {
            if (token !== this.token) {
                return;
            }
            this.applyLoadFailure(error);
        }
    }

    async submit(): Promise<void> {
        const params = this.params;
        const loaded = this.review;
        const userId = this.picker.vm.value;
        if (!params || !loaded || userId === null || !this.vm.canSubmit) {
            return;
        }

        const { namespace, request } = params;
        const step = loaded.review.steps.find(item => item.id === request.stepId);
        if (!step) {
            return;
        }
        const newOwner = this.candidates.find(candidate => candidate.id === userId);
        if (!newOwner) {
            return;
        }
        const token = this.token;
        // R266: a TargetSync failure means the reassign was saved, only the content sync failed.
        let contentNotUpdated = false;

        this.startSubmit();

        try {
            await this.reassignReviewStepUseCase.execute({
                namespace,
                reviewId: request.reviewId,
                stepId: step.id,
                userId
            });
        } catch (error) {
            if (token !== this.token) {
                return;
            }

            const errorKind = classifyReviewActionError(error);

            if (errorKind === "targetSync") {
                contentNotUpdated = true;
            } else if (errorKind === "conflict") {
                let fresh: ReviewWithFlags | null = null;
                try {
                    fresh = await this.getReviewUseCase.execute({
                        namespace,
                        reviewId: request.reviewId
                    });
                } catch {
                    fresh = null;
                }
                if (token !== this.token) {
                    return;
                }
                const now = new Date();
                const message = getConflictMessage({
                    kind: "reassign",
                    stepId: request.stepId,
                    review: fresh ? fresh.review : null,
                    now,
                    listRefreshed: params.listRefreshed === true
                });
                this.applyConflict(message.title, message.message, fresh);
                if (params.onConflict) {
                    params.onConflict();
                }
                return;
            } else if (errorKind === "validation" && error instanceof GraphQLOperationError) {
                this.applyFieldError(error.message);
                return;
            } else {
                this.applyDialogError(getActionErrorMessage(errorKind, error));
                return;
            }
        }

        if (token !== this.token) {
            return;
        }

        this.toasts.show({
            kind: "reassigned",
            stepTitle: step.title,
            personName: newOwner.displayName,
            reviewsUrl: params.reviewsUrl,
            contentNotUpdated
        });
        this.finishSubmit();
        params.onDone();
    }

    dismiss(): void {
        // A dialog that is submitting stays open: closing it would lose the success path.
        if (this.params && !this.submitting) {
            this.params.onClose();
        }
    }

    dispose(): void {
        this.token += 1;
        this.picker.dispose();
        this.params = null;
        this.review = null;
        this.candidates = [];
        this.status = "loading";
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
    }

    private begin(params: ReassignDialogInitParams): number {
        this.token += 1;
        this.params = params;
        this.review = null;
        this.candidates = [];
        this.status = "loading";
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
        return this.token;
    }

    private applyLoaded(loaded: ReviewWithFlags): void {
        this.review = loaded;
        this.status = "ready";
    }

    private applyLoadFailure(error?: unknown): void {
        this.status = "failed";
        const errorKind = classifyReviewActionError(error);
        this.dialogError = getActionErrorMessage(errorKind, error);
    }

    private startSubmit(): void {
        this.submitting = true;
        this.fieldError = null;
        this.dialogError = null;
    }

    private finishSubmit(): void {
        this.submitting = false;
    }

    private applyConflict(title: string, message: string, fresh: ReviewWithFlags | null): void {
        this.submitting = false;
        this.conflict = { title, message };
        if (fresh) {
            this.review = fresh;
        }
    }

    private applyFieldError(message: string): void {
        this.submitting = false;
        this.fieldError = message;
    }

    private applyDialogError(message: string): void {
        this.submitting = false;
        this.dialogError = message;
    }
}

export const ReassignDialogPresenter = Abstraction.createImplementation({
    implementation: ReassignDialogPresenterImpl,
    dependencies: [
        GetReviewUseCase,
        ListReviewStepCandidatesUseCase,
        ReassignReviewStepUseCase,
        ReviewerPickerPresenter,
        ReviewToasts
    ]
});
