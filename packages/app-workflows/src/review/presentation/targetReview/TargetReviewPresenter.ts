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
import type { ReviewContentNoticeVm } from "./abstractions.js";
import type { TargetReviewActionKind } from "./abstractions.js";
import type { TargetReviewContext } from "./abstractions.js";
import type { TargetReviewFailureKind } from "./abstractions.js";
import type { TargetReviewInitParams } from "./abstractions.js";
import type { TargetReviewOpenAction } from "./abstractions.js";
import type { TargetReviewStatus } from "./abstractions.js";
import { buildTargetReviewViewModel } from "./buildTargetReviewViewModel.js";
import { getContentNotice } from "./getContentNotice.js";
import { getFinishedAutomatedStep } from "./getFinishedAutomatedStep.js";
import { getTargetIdFromRevisionId } from "./getTargetIdFromRevisionId.js";

class TargetReviewPresenterImpl implements Abstraction.Interface {
    private params: TargetReviewInitParams | null = null;
    private status: TargetReviewStatus = "loading";
    private failureKind: TargetReviewFailureKind | null = null;
    private review: ReviewWithFlags | null = null;
    private busy = false;
    private action: TargetReviewOpenAction | null = null;
    private contentNotice: ReviewContentNoticeVm | null = null;
    private loadToken = 0;
    // Bumped by `init` and `dispose`: a reload that settles after either must not set the notice.
    private generation = 0;
    // A load is on the wire, including the publish and reload that finish it (R260).
    private inFlight = false;
    // True while the presenter is inside its own `activity.notify` call (R260).
    private notifying = false;
    // A signal arrived during a load: one more refresh runs when that load settles (R260).
    private refreshQueued = false;
    private unsubscribe: (() => void) | null = null;

    constructor(
        private eventPublisher: EventPublisher.Interface,
        private activity: ReviewActivity.Interface,
        private identityContext: IdentityContext.Interface
    ) {
        makeAutoObservable<
            TargetReviewPresenterImpl,
            | "eventPublisher"
            | "activity"
            | "identityContext"
            | "loadToken"
            | "generation"
            | "inFlight"
            | "notifying"
            | "refreshQueued"
            | "unsubscribe"
            | "params"
            | "review"
            | "contentNotice"
        >(this, {
            eventPublisher: false,
            activity: false,
            identityContext: false,
            loadToken: false,
            generation: false,
            inFlight: false,
            notifying: false,
            refreshQueued: false,
            unsubscribe: false,
            params: observableRef,
            review: observableRef,
            contentNotice: observableRef
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
            openAction: this.action,
            contentNotice: this.contentNotice
        });
    }

    async init(params: TargetReviewInitParams): Promise<void> {
        this.begin(params);
        this.unsubscribe = this.activity.subscribe([params.target.namespace], signal => {
            this.handleSignal(signal);
        });
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

        const generation = this.generation;
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

        const previous = this.review;
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

        const finished = getFinishedAutomatedStep(
            previous ? previous.review : null,
            current ? current.review : null
        );
        // A dispose or a re-init during the publish await makes this reload stale: skip it.
        if (
            finished !== null &&
            params.contentReloader !== null &&
            generation === this.generation
        ) {
            let changed = false;
            try {
                changed = await params.contentReloader.reload();
            } catch {
                // A failing reload shows no notice; the review state above is already applied.
            }
            if (changed && generation === this.generation) {
                const notice = getContentNotice(finished);
                this.setContentNotice(notice);
            }
        }

        if (token === this.loadToken) {
            this.inFlight = false;
            if (this.refreshQueued) {
                this.refreshQueued = false;
                await this.refresh();
            }
        }
    }

    async actionDone(): Promise<void> {
        const params = this.params;
        if (!params) {
            return;
        }

        const reviewBefore = this.review;

        this.contentNotice = null;
        this.closeAction();
        await this.refresh();

        // The review after the action; a cancel leaves none, so the one read before it stands in.
        let reviewId: string | null = null;
        if (this.review) {
            reviewId = this.review.review.id;
        } else if (reviewBefore) {
            reviewId = reviewBefore.review.id;
        }
        this.notifying = true;
        try {
            this.activity.notify({
                namespace: params.target.namespace,
                source: "own",
                reviewId,
                targetRevisionId: params.target.targetRevisionId
            });
        } finally {
            this.notifying = false;
        }
    }

    openAction(kind: TargetReviewActionKind, stepId: string | null): void {
        this.contentNotice = null;
        this.action = { kind, stepId };
    }

    closeAction(): void {
        this.action = null;
    }

    dispose(): void {
        this.loadToken += 1;
        this.generation += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = null;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
        this.contentNotice = null;
    }

    private begin(params: TargetReviewInitParams): void {
        this.loadToken += 1;
        this.generation += 1;
        this.dropSubscription();
        this.inFlight = false;
        this.refreshQueued = false;
        this.params = params;
        this.status = "loading";
        this.failureKind = null;
        this.review = null;
        this.busy = false;
        this.action = null;
        this.contentNotice = null;
    }

    private dropSubscription(): void {
        if (this.unsubscribe !== null) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    /*
     * A signal of this presenter's review or revision refreshes it once (R260). Its own signal is
     * ignored (the own action refreshes itself), and a signal during a load queues one more
     * refresh instead of starting a parallel one.
     */
    private handleSignal(signal: ReviewActivity.Signal): void {
        const params = this.params;
        if (!params || this.notifying) {
            return;
        }

        const sameReview = this.review !== null && signal.reviewId === this.review.review.id;
        const sameRevision = signal.targetRevisionId === params.target.targetRevisionId;
        if (!sameReview && !sameRevision) {
            return;
        }

        if (this.inFlight) {
            this.refreshQueued = true;
            return;
        }
        void this.refresh();
    }

    private setContentNotice(notice: ReviewContentNoticeVm): void {
        this.contentNotice = notice;
    }

    private startLoad(): number {
        this.loadToken += 1;
        this.busy = true;
        this.inFlight = true;
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
        this.inFlight = false;
        this.refreshQueued = false;
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
