import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { AssignmentRecordValues } from "./types.js";

/**
 * The assignment-log records one saved fact produces, in decision order (spec 4.3, 6, R117).
 * Pure. Step reached carries the resolver's skips and outcome; start, take over and reassign carry one
 * outcome. `assignedOn` is the fact's time, which is the reach `now`. Every fact type has a case,
 * so a new fact does not compile until it says whether it writes records.
 */
export const toAssignmentRecordValues = (
    review: ReviewData,
    fact: ReviewFact
): AssignmentRecordValues[] => {
    switch (fact.type) {
        case "stepReached":
        case "stepStarted":
        case "stepTakenOver":
        case "stepReassigned":
            return fact.records.map((record): AssignmentRecordValues => {
                return {
                    ...record,
                    by: record.by ? { ...record.by } : null,
                    reviewId: review.id,
                    workflowId: review.workflowId,
                    stepId: fact.change.stepId,
                    assignedOn: fact.occurredOn
                };
            });
        case "requested":
        case "stepApproved":
        case "stepRejected":
        case "stepFailed":
        case "stepRestarted":
        case "cancelled":
        case "approved":
            return [];
    }
};
