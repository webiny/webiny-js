import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewTargetSync } from "../ReviewTargetSync/abstractions.js";
import {
    ReviewApprovedEvent,
    ReviewCancelledEvent,
    type ReviewEvent,
    ReviewRequestedEvent,
    ReviewStepApprovedEvent,
    ReviewStepReachedEvent,
    ReviewStepRejectedEvent,
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "../events.js";
import { ReviewSaver as Abstraction } from "./abstractions.js";

class ReviewSaverImpl implements Abstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSyncs: ReviewTargetSync.Interface[],
        private eventPublisher: EventPublisher.Interface
    ) {}

    async save(review: Review): Abstraction.Return {
        review.prepareForSave();
        // Facts are pulled before persisting. If the save fails they are lost from this instance,
        // which is fine: every use case discards the instance after a failed save.
        const facts = review.pullFacts();

        // No optimistic locking on reviews (D27).
        const result = await this.repository.save(review.toData());
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        const saved = result.value;

        const synced = await this.sync(saved);

        // The review is saved, so its facts happened: publish them even when the sync failed
        // (R16). Handler exceptions propagate, as everywhere else in the repo.
        for (const fact of facts) {
            await this.eventPublisher.publish(this.createEvent(saved, fact));
        }

        if (synced.isFail()) {
            return Result.fail(new ReviewTargetSyncError({ review: saved, error: synced.error }));
        }
        return Result.ok(saved);
    }

    private async sync(saved: ReviewData): Promise<Result<void, Error>> {
        // One sync per namespace; the last registered match wins. No match: nothing to sync.
        const targetSync = [...this.targetSyncs].reverse().find(item => item.canSync(saved.model));
        if (!targetSync) {
            return Result.ok();
        }
        try {
            return await targetSync.sync({
                review: saved,
                systemWorkflow: Review.fromData(saved).getSystemWorkflow()
            });
        } catch (error) {
            return Result.fail(error instanceof Error ? error : new Error(String(error)));
        }
    }

    private createEvent(review: ReviewData, fact: ReviewFact): ReviewEvent {
        switch (fact.type) {
            case "requested":
                return new ReviewRequestedEvent({ review, fact });
            case "stepReached":
                return new ReviewStepReachedEvent({ review, fact });
            case "stepStarted":
                return new ReviewStepStartedEvent({ review, fact });
            case "stepTakenOver":
                return new ReviewStepTakenOverEvent({ review, fact });
            case "stepApproved":
                return new ReviewStepApprovedEvent({ review, fact });
            case "stepRejected":
                return new ReviewStepRejectedEvent({ review, fact });
            case "cancelled":
                return new ReviewCancelledEvent({ review, fact });
            case "approved":
                return new ReviewApprovedEvent({ review, fact });
        }
    }
}

export const ReviewSaver = Abstraction.createImplementation({
    implementation: ReviewSaverImpl,
    dependencies: [ReviewRepository, [ReviewTargetSync, { multiple: true }], EventPublisher]
});
