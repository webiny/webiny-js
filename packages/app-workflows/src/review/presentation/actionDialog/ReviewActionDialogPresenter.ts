import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import type { ReviewToastParams } from "~/review/toasts/abstractions.js";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewActionDialogPresenter as Abstraction } from "./abstractions.js";
import type { ReviewActionConflictVm } from "./abstractions.js";
import type { ReviewActionDialogInitParams } from "./abstractions.js";
import { getActionDialogCopy } from "./getActionDialogCopy.js";
import { getConflictMessage } from "./getConflictMessage.js";
import { getNextStepTitle } from "./getNextStepTitle.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";
import { getActionErrorMessage } from "./getActionErrorMessage.js";

class ReviewActionDialogPresenterImpl implements Abstraction.Interface {
    private params: ReviewActionDialogInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private status: "loading" | "ready" | "failed" = "loading";
    private comment = "";
    private touched = false;
    private notify = true;
    private submitting = false;
    private fieldError: string | null = null;
    private dialogError: string | null = null;
    private conflict: ReviewActionConflictVm | null = null;
    private titleOverride: string | null = null;
    private token = 0;

    constructor(
        private getReviewUseCase: GetReviewUseCase.Interface,
        private startReviewStepUseCase: StartReviewStepUseCase.Interface,
        private takeOverReviewStepUseCase: TakeOverReviewStepUseCase.Interface,
        private approveReviewStepUseCase: ApproveReviewStepUseCase.Interface,
        private rejectReviewStepUseCase: RejectReviewStepUseCase.Interface,
        private cancelReviewUseCase: CancelReviewUseCase.Interface,
        private restartReviewStepUseCase: RestartReviewStepUseCase.Interface,
        private toasts: ReviewToasts.Interface
    ) {
        makeAutoObservable<
            ReviewActionDialogPresenterImpl,
            | "getReviewUseCase"
            | "startReviewStepUseCase"
            | "takeOverReviewStepUseCase"
            | "approveReviewStepUseCase"
            | "rejectReviewStepUseCase"
            | "cancelReviewUseCase"
            | "restartReviewStepUseCase"
            | "toasts"
            | "token"
            | "params"
            | "review"
        >(this, {
            getReviewUseCase: false,
            startReviewStepUseCase: false,
            takeOverReviewStepUseCase: false,
            approveReviewStepUseCase: false,
            rejectReviewStepUseCase: false,
            cancelReviewUseCase: false,
            restartReviewStepUseCase: false,
            toasts: false,
            token: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const params = this.params;
        const review = this.review;
        if (!params || !review || this.status !== "ready") {
            return {
                status: this.status,
                title: "",
                body: "",
                showComment: false,
                commentLabel: "",
                commentRequired: false,
                commentPlaceholder: "",
                commentNote: null,
                comment: this.comment,
                commentCounter: null,
                commentError: null,
                showNotify: false,
                notify: this.notify,
                notifyLabel: null,
                confirmLabel: "",
                confirmVariant: "primary",
                cancelLabel: "Cancel",
                canSubmit: false,
                submitting: this.submitting,
                fieldError: this.fieldError,
                dialogError: this.dialogError,
                conflict: this.conflict
            };
        }

        const copy = getActionDialogCopy({
            kind: params.request.kind,
            review: review.review,
            stepId: params.request.stepId,
            comment: this.comment,
            context: params.request.context,
            touched: this.touched
        });
        let title = copy.title;
        if (this.titleOverride !== null) {
            title = this.titleOverride;
        }

        return {
            status: this.status,
            title,
            body: copy.body,
            showComment: copy.showComment,
            commentLabel: copy.commentLabel,
            commentRequired: copy.commentRequired,
            commentPlaceholder: copy.commentPlaceholder,
            commentNote: copy.commentNote,
            comment: this.comment,
            commentCounter: copy.commentCounter,
            commentError: copy.commentError,
            showNotify: copy.showNotify,
            notify: this.notify,
            notifyLabel: copy.notifyLabel,
            confirmLabel: copy.confirmLabel,
            confirmVariant: copy.confirmVariant,
            cancelLabel: copy.cancelLabel,
            canSubmit: copy.canSubmit && !this.submitting && this.conflict === null,
            submitting: this.submitting,
            fieldError: this.fieldError,
            dialogError: this.dialogError,
            conflict: this.conflict
        };
    }

    async init(params: ReviewActionDialogInitParams): Promise<void> {
        const token = this.begin(params);

        try {
            const loaded = await this.getReviewUseCase.execute({
                namespace: params.namespace,
                reviewId: params.request.reviewId
            });
            if (token !== this.token) {
                return;
            }
            const hasStep = loaded.review.steps.some(item => item.id === params.request.stepId);
            if (params.request.kind !== "cancel" && !hasStep) {
                this.applyLoadFailure();
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

    setComment(comment: string): void {
        this.comment = comment;
        this.touched = true;
        this.fieldError = null;
    }

    setNotify(notify: boolean): void {
        this.notify = notify;
    }

    async submit(): Promise<void> {
        const params = this.params;
        const loaded = this.review;
        if (!params || !loaded || this.status !== "ready" || !this.vm.canSubmit) {
            return;
        }

        const { namespace, request } = params;
        const stepId = request.stepId ?? "";
        const step = loaded.review.steps.find(item => item.id === request.stepId);
        const stepTitle = step ? step.title : "";
        const reviewsUrl = params.reviewsUrl;
        const comment = this.comment.trim();
        const owner = step ? step.owner : null;
        let notifyName: string | null = null;
        if (request.kind === "takeOver" && this.notify && owner !== null && owner.type === "user") {
            notifyName = owner.displayName;
        }
        const token = this.token;
        let toast: ReviewToastParams = {
            kind: "cancelled",
            stepTitle: null,
            personName: null,
            reviewsUrl
        };

        this.startSubmit();

        // The success toast is set before each call, so a TargetSync failure (R266) shows it too.
        try {
            if (request.kind === "start") {
                toast = { kind: "started", stepTitle, personName: null, reviewsUrl };
                await this.startReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId
                });
            } else if (request.kind === "takeOver") {
                toast = { kind: "tookOver", stepTitle, personName: notifyName, reviewsUrl };
                await this.takeOverReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId,
                    notifyPreviousOwner: this.notify
                });
            } else if (request.kind === "approve") {
                // Until the approval returns a review, the next step is the one after in order.
                const index = loaded.review.steps.findIndex(item => item.id === stepId);
                const following = loaded.review.steps[index + 1];
                toast = {
                    kind: "approved",
                    stepTitle,
                    personName: null,
                    nextStepTitle: following ? following.title : null,
                    reviewsUrl
                };
                const approved = await this.approveReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId,
                    comment: comment === "" ? null : comment
                });
                toast = { ...toast, nextStepTitle: getNextStepTitle(approved) };
            } else if (request.kind === "reject") {
                toast = { kind: "rejected", stepTitle, personName: null, reviewsUrl };
                await this.rejectReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId,
                    comment
                });
            } else if (request.kind === "cancel") {
                await this.cancelReviewUseCase.execute({ namespace, reviewId: request.reviewId });
            } else if (request.kind === "restart") {
                toast = { kind: "restarted", stepTitle, personName: null, reviewsUrl };
                await this.restartReviewStepUseCase.execute({
                    namespace,
                    reviewId: request.reviewId,
                    stepId
                });
            }
        } catch (error) {
            if (token !== this.token) {
                return;
            }

            const errorKind = classifyReviewActionError(error);

            if (errorKind === "targetSync") {
                /*
                 * R266: the action was saved and only the content sync failed, so it is done; the
                 * toast warns that the content was not updated. An approval has no returned
                 * review, so the next step comes from a re-read.
                 */
                if (toast.kind === "approved") {
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
                    if (fresh) {
                        toast = { ...toast, nextStepTitle: getNextStepTitle(fresh.review) };
                    }
                }
                toast = { ...toast, contentNotUpdated: true };
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
                    kind: request.kind,
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

        this.toasts.show(toast);
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
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.comment = "";
        this.touched = false;
        this.notify = true;
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
        this.titleOverride = null;
    }

    private begin(params: ReviewActionDialogInitParams): number {
        this.token += 1;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.comment = "";
        this.touched = false;
        this.notify = true;
        this.submitting = false;
        this.fieldError = null;
        this.dialogError = null;
        this.conflict = null;
        this.titleOverride = null;
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
        this.conflict = { title, message, commentKept: this.comment.trim() !== "" };
        if (fresh) {
            this.review = fresh;
            const cancelled: Review = fresh.review;
            if (cancelled.state === ReviewState.Cancelled || !cancelled.isActive) {
                const step = cancelled.steps.find(item => item.id === this.params?.request.stepId);
                if (step) {
                    this.titleOverride = step.title;
                }
            }
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

export const ReviewActionDialogPresenter = Abstraction.createImplementation({
    implementation: ReviewActionDialogPresenterImpl,
    dependencies: [
        GetReviewUseCase,
        StartReviewStepUseCase,
        TakeOverReviewStepUseCase,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        CancelReviewUseCase,
        RestartReviewStepUseCase,
        ReviewToasts
    ]
});
