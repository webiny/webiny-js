import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { toAssignmentRecordValues } from "~/domain/assignment/toAssignmentRecordValues.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewTargetSync } from "../ReviewTargetSync/abstractions.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import {
    ReviewApprovedEvent,
    ReviewCancelledEvent,
    type ReviewEvent,
    ReviewRequestedEvent,
    ReviewStepApprovedEvent,
    ReviewStepFailedEvent,
    ReviewStepReachedEvent,
    ReviewStepReassignedEvent,
    ReviewStepRejectedEvent,
    ReviewStepRestartedEvent,
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "../events.js";
import { ReviewSaver as Abstraction } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

class ReviewSaverImpl implements Abstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSyncs: ReviewTargetSync.Interface[],
        private eventPublisher: EventPublisher.Interface,
        private assignments: AssignmentRepository.Interface,
        private logger: Logger.Interface,
        private taskAbort: ReviewTaskAbortService.Interface
    ) {}

    async save(review: Review): Abstraction.Return {
        review.prepareForSave();
        // Facts are pulled before persisting. If the save fails they are lost from this instance,
        // which is fine: every use case discards the instance after a failed save.
        const facts = review.pullFacts();

        // No optimistic locking on reviews (D27).
        const result = await this.repository.save(review.toData());
        if (result.isFail()) {
            // The automation reach triggers its task before this save (R143). The review will not
            // carry the task id, so abort the tasks the recorded reaches started. Best effort: the
            // abort never throws and never changes the error returned here.
            const taskIds: string[] = [];
            for (const fact of facts) {
                if (fact.type === "stepReached" && fact.taskId) {
                    taskIds.push(fact.taskId);
                }
            }
            await this.taskAbort.abort({
                taskIds,
                message: "The review could not be saved."
            });
            return Result.fail(result.error);
        }
        const saved = result.value;

        // The review is saved, so its assignment decisions happened: write them to the log
        // (R117). Writing after the save leaves no orphaned records when the save fails; a failed
        // write is logged and never fails the request.
        for (const fact of facts) {
            for (const values of toAssignmentRecordValues(saved, fact)) {
                try {
                    const created = await this.assignments.create(values);
                    if (created.isFail()) {
                        this.logger.error(
                            {
                                err: hasErrorSource(created.error)
                                    ? created.error.source
                                    : created.error,
                                reviewId: saved.id,
                                stepId: values.stepId,
                                source: values.source
                            },
                            "Could not write an assignment record; the review was saved without it."
                        );
                    }
                } catch (error) {
                    this.logger.error(
                        {
                            err: error,
                            reviewId: saved.id,
                            stepId: values.stepId,
                            source: values.source
                        },
                        "Could not write an assignment record; the review was saved without it."
                    );
                }
            }
        }

        // One sync per namespace; the last registered match wins. No match: nothing to sync.
        let synced: Result<void, Error> = Result.ok();
        const targetSync = [...this.targetSyncs].reverse().find(item => item.canSync(saved.model));
        if (targetSync) {
            try {
                synced = await targetSync.sync({
                    review: saved,
                    systemWorkflow: Review.fromData(saved).getSystemWorkflow()
                });
            } catch (error) {
                synced = Result.fail(error instanceof Error ? error : new Error(String(error)));
            }
        }

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
            case "stepReassigned":
                return new ReviewStepReassignedEvent({ review, fact });
            case "stepApproved":
                return new ReviewStepApprovedEvent({ review, fact });
            case "stepRejected":
                return new ReviewStepRejectedEvent({ review, fact });
            case "stepFailed":
                return new ReviewStepFailedEvent({ review, fact });
            case "stepRestarted":
                return new ReviewStepRestartedEvent({ review, fact });
            case "cancelled":
                return new ReviewCancelledEvent({ review, fact });
            case "approved":
                return new ReviewApprovedEvent({ review, fact });
        }
    }
}

export const ReviewSaver = Abstraction.createImplementation({
    implementation: ReviewSaverImpl,
    dependencies: [
        ReviewRepository,
        [ReviewTargetSync, { multiple: true }],
        EventPublisher,
        AssignmentRepository,
        Logger,
        ReviewTaskAbortService
    ]
});
