import { makeAutoObservable } from "mobx";
import { observableRef } from "mobx";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/abstractions.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { TargetReviewPresenter as Abstraction } from "./abstractions.js";
import type { TargetReviewActionKind } from "./abstractions.js";
import type { TargetReviewContext } from "./abstractions.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { TargetReviewInitParams } from "./abstractions.js";
import type { TargetReviewOpenAction } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import { buildTargetReviewViewModel } from "./buildTargetReviewViewModel.js";
import { getTargetIdFromRevisionId } from "./getTargetIdFromRevisionId.js";

class TargetReviewPresenterImpl implements Abstraction.Interface {
    private params: TargetReviewInitParams | null = null;
    private status: TargetReviewStatus = "loading";
    private failureKind: TargetReviewFailureKind | null = null;
    private review: ReviewWithFlags | null = null;
    private busy = false;
    private action: TargetReviewOpenAction | null = null;
    private loadToken = 0;

    constructor(
        private eventPublisher: EventPublisher.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            TargetReviewPresenterImpl,
            "eventPublisher" | "activity" | "identityContext" | "loadToken" | "params" | "review"
        >(this, {
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
            params: observableRef,
            review: observableRef
        });
    }

    get vm(): Abstraction.ViewModel {
        const params = this.params;
        const identity = this.identityContext.getIdentity();
        const viewerTeamIds = identity.teams.map(team => team.id);
        return buildTargetReviewViewModel({
            status: this.status,
            failureKind: this.failureKind,
            review: this.review,
            canRequest: params ? params.canRequest : false,
            isPublished: params ? params.isPublished : false,
            isUnpublished: params ? params.isUnpublished : false,
            viewerTeamIds,
            targetTitle: params ? params.targetTitle : "",
            namespace: params ? params.target.namespace : "",
            targetRevisionId: params ? params.target.targetRevisionId : "",
            busy: this.busy,
            openAction: this.action
        });
    }

    async init(params: TargetReviewInitParams): Promise<void> {
        this.begin(params);
        await this.refresh();
    }

    setContext(context: TargetReviewContext): void {
        if (!this.params) {
            return;
        }
        this.params = {
            ...this.params,
            targetTitle: context.targetTitle,
            canRequest: context.canRequest,
            isPublished: context.isPublished,
            isUnpublished: context.isUnpublished
        };
    }

    async refresh(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const token = this.startLoad();
        let review: ReviewWithFlags | null = null;
        let hasWorkflow = false;

        try {
            const workflow = await params.useCases.getBoundWorkflow(params.target.namespace);
            if (token !== this.loadToken) {
                return;
            }
            hasWorkflow = workflow !== null;
            if (hasWorkflow) {
                review = await params.useCases.getTargetReview(params.target);
                if (token !== this.loadToken) {
                    return;
                }
            }
        } catch (error) {
            if (token !== this.loadToken) {
                return;
            }
            this.applyFailure(error);
            return;
        }

        this.applyLoaded(hasWorkflow, review);

        const current = this.review;
        let targetId = getTargetIdFromRevisionId(params.target.targetRevisionId);
        if (current) {
            targetId = current.review.targetId;
        }
        const event = new ReviewChangedEvent({
            namespace: params.target.namespace,
            targetId,
            targetRevisionId: params.target.targetRevisionId,
            review: current ? current.review : null
        });

        try {
            await this.eventPublisher.publish(event);
        } catch {
            // A failing cache writer must not break the bar; the state above is already applied.
        }
    }

    async actionDone(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const reviewBefore = this.review;

        this.closeAction();
        await this.refresh();

        // The review after the action; a cancel leaves none, so the one read before it stands in.
        let reviewId: string | null = null;
        if (this.review) {
            reviewId = this.review.review.id;
        } else if (reviewBefore) {
            reviewId = reviewBefore.review.id;
        }
        this.activity.notify({
            namespace: params.target.namespace,
            source: "own",
            reviewId,
            targetRevisionId: params.target.targetRevisionId
        });
    }

    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.action = { kind, stepId };
    }

    closeAction(): void {
        this.action = null;
    }

    dispose(): void {
        this.loadToken += 1;
        this.params = null;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
    }

    private begin(params: TargetReviewInitParams): void {
        this.loadToken += 1;
        this.params = params;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
    }

    private startLoad(): number {
        this.loadToken += 1;
        this.busy = true;
        return this.loadToken;
    }

    private applyLoaded(hasWorkflow: boolean, review: ReviewWithFlags | null): void {
        this.busy = false;
        this.failureKind = null;

        if (!hasWorkflow) {
            this.review = null;
            this.status = "noWorkflow";
            return;
        }
        if (review === null || review.review.state === ReviewState.Cancelled) {
            this.review = null;
            this.status = "none";
            return;
        }
        this.review = review;
        this.status = "active";
    }

    private applyFailure(error: unknown): void {
        this.busy = false;
        this.review = null;
        this.status = "failed";
        this.failureKind = "error";
        if (
            error instanceof GraphQLOperationError &&
            error.code === ReviewErrorCode.NotAuthorized
        ) {
            this.failureKind = "noAccess";
        }
    }
}

export const TargetReviewPresenter = Abstraction.createImplementation({
    implementation: TargetReviewPresenterImpl,
    dependencies: [EventPublisher, ReviewActivity, IdentityContext]
});
