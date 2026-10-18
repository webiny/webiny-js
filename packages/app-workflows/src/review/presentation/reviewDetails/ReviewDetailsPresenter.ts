import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { getWorkflowsPermissionSet } from "~/review/domain/getWorkflowsPermissionSet.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { classifyReviewActionError } from "../actionDialog/classifyReviewActionError.js";
import { getActionErrorMessage } from "../actionDialog/getActionErrorMessage.js";
import type { TargetReviewActionKind } from "../targetReview/abstractions.js";
import type { TargetReviewOpenAction } from "../targetReview/abstractions.js";
import { ReviewDetailsPresenter as Abstraction } from "./abstractions.js";
import type { ReviewDetailsInitParams } from "./abstractions.js";
import type { ReviewDetailsStatus } from "./abstractions.js";
import { buildReviewDetailsViewModel } from "./buildReviewDetailsViewModel.js";

const LOAD_FAILED_MESSAGE = "The server did not respond. Try again in a moment.";

class ReviewDetailsPresenterImpl implements Abstraction.Interface {
    private params: ReviewDetailsInitParams | null = null;
    private review: ReviewWithFlags | null = null;
    private status: ReviewDetailsStatus = "loading";
    private error: string | null = null;
    private action: TargetReviewOpenAction | null = null;
    private token = 0;
    // A load is on the wire (R260).
    private inFlight = false;
    // A signal arrived during a load: one more refresh runs when that load settles (R260).
    private refreshQueued = false;
    // True while the presenter is inside its own `activity.notify` call (R260).
    private notifying = false;
    private unsubscribe: (() => void) | null = null;

    constructor(
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            ReviewDetailsPresenterImpl,
            | "activity"
            | "identityContext"
            | "token"
            | "inFlight"
            | "refreshQueued"
            | "notifying"
            | "unsubscribe"
            | "params"
            | "review"
        >(this, {
            activity: false,
            identityContext: false,
            token: false,
            inFlight: false,
            refreshQueued: false,
            notifying: false,
            unsubscribe: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const identity = this.identityContext.getIdentity();
        const permissions = getWorkflowsPermissionSet(identity);
        return buildReviewDetailsViewModel({
            status: this.status,
            review: this.review,
            error: this.error,
            openAction: this.action,
            canViewStepRun: permissions.editor || permissions.reassign,
            now: new Date()
        });
    }

    async init(params: ReviewDetailsInitParams): Promise<void> {
        this.begin(params);
        await this.refresh();
    }

    async refresh(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const token = this.nextToken();
        this.inFlight = true;

        try {
            const loaded = await params.useCases.getReview(params.reviewId);
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
            if (this.unsubscribe === null) {
                // The namespace is only known once the review is loaded.
                this.unsubscribe = this.activity.subscribe([loaded.review.namespace], signal => {
                    this.handleSignal(signal);
                });
            }
        } catch (error) {
            if (token !== this.token) {
                return;
            }
            this.applyFailure(error);
            return;
        }

        this.inFlight = false;
        if (this.refreshQueued) {
            this.refreshQueued = false;
            await this.refresh();
        }
    }

    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.action = { kind, stepId };
    }

    closeAction(): void {
        this.action = null;
    }

    async actionDone(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        // Read before the refresh: a failed refresh clears the review, and the lists still need
        // the signal because the action itself succeeded.
        let namespace: string | null = null;
        let targetRevisionId: string | null = null;
        if (this.review) {
            namespace = this.review.review.namespace;
            targetRevisionId = this.review.review.targetRevisionId;
        }

        this.closeAction();
        await this.refresh();

        if (namespace !== null) {
            this.notifying = true;
            try {
                this.activity.notify({
                    namespace,
                    source: "own",
                    reviewId: params.reviewId,
                    targetRevisionId
                });
            } finally {
                this.notifying = false;
            }
        }
    }

    dispose(): void {
        this.token += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private begin(params: ReviewDetailsInitParams): void {
        this.token += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private dropSubscription(): void {
        if (this.unsubscribe !== null) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /*
     * A signal of this review refreshes it once (R260). Its own signal is ignored (the own action
     * refreshes itself), and a signal during a load queues one more refresh.
     */
    private handleSignal(signal: ReviewActivity.Signal): void {
        const params = this.params;
        if (!params || this.notifying) {
            return;
        }
        if (signal.reviewId !== params.reviewId) {
            return;
        }
        if (this.inFlight) {
            this.refreshQueued = true;
            return;
        }
        void this.refresh();
    }

    private nextToken(): number {
        this.token += 1;
        return this.token;
    }

    private applyLoaded(loaded: ReviewWithFlags): void {
        this.review = loaded;
        this.status = "loaded";
        this.error = null;
    }

    private applyFailure(error: unknown): void {
        this.inFlight = false;
        this.refreshQueued = false;
        this.review = null;
        this.status = "failed";
        const errorKind = classifyReviewActionError(error);
        this.error = getActionErrorMessage(errorKind, error, LOAD_FAILED_MESSAGE);
    }
}

export const ReviewDetailsPresenter = Abstraction.createImplementation({
    implementation: ReviewDetailsPresenterImpl,
    dependencies: [ReviewActivity, IdentityContext]
});
