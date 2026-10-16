import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { ReviewActivity } from "~/review/activity/abstractions.js";
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

    constructor(private activity: ReviewActivity.Interface) {
        makeAutoObservable<ReviewDetailsPresenterImpl, "activity" | "token" | "params" | "review">(
            this,
            {
                activity: false,
                token: false,
                params: observableRef,
                review: observableRef
            }
        );
    }

    get vm(): Abstraction.ViewModel {
        return buildReviewDetailsViewModel({
            status: this.status,
            review: this.review,
            error: this.error,
            openAction: this.action,
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

        try {
            const loaded = await params.useCases.getReview(params.reviewId);
            if (token !== this.token) {
                return;
            }
            this.applyLoaded(loaded);
        } catch (error) {
            if (token !== this.token) {
                return;
            }
            this.applyFailure(error);
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
        if (this.review) {
            namespace = this.review.review.namespace;
        }

        this.closeAction();
        await this.refresh();

        if (namespace !== null) {
            this.activity.notify({ namespace, source: "own" });
        }
        if (params.onChanged) {
            params.onChanged();
        }
    }

    dispose(): void {
        this.token += 1;
        this.params = null;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
    }

    private begin(params: ReviewDetailsInitParams): void {
        this.token += 1;
        this.params = params;
        this.review = null;
        this.status = "loading";
        this.error = null;
        this.action = null;
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
        this.review = null;
        this.status = "failed";
        const errorKind = classifyReviewActionError(error);
        this.error = getActionErrorMessage(errorKind, error, LOAD_FAILED_MESSAGE);
    }
}

export const ReviewDetailsPresenter = Abstraction.createImplementation({
    implementation: ReviewDetailsPresenterImpl,
    dependencies: [ReviewActivity]
});
