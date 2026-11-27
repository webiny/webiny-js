import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type {
    ReviewPersistenceError,
    ReviewPublishBlockedError
} from "@webiny/api-workflows/domain/review/errors.js";

export interface ApprovedReviewPublishRuleParams {
    /** Review namespace id, e.g. "cms.article" or "wb.page". */
    namespace: string;
    targetRevisionId: string;
}

export interface IApprovedReviewPublishRuleErrors {
    publishBlocked: ReviewPublishBlockedError;
    workflowPersistence: WorkflowPersistenceError;
    reviewPersistence: ReviewPersistenceError;
}

type RuleError = IApprovedReviewPublishRuleErrors[keyof IApprovedReviewPublishRuleErrors];

export interface IApprovedReviewPublishRule {
    check(params: ApprovedReviewPublishRuleParams): Promise<Result<void, RuleError>>;
}

/**
 * The publish rule of the review adapters (spec 5.1, D79, D121, R53): with a workflow bound to the
 * namespace, a revision may be published only with its active review approved. Lookup failures
 * fail (fail closed). Shared by the publish hooks and the scheduler guards, so scheduling a publish
 * is allowed exactly when publishing now is.
 */
export const ApprovedReviewPublishRule = createAbstraction<IApprovedReviewPublishRule>(
    "CmsWorkflows/ApprovedReviewPublishRule"
);

export namespace ApprovedReviewPublishRule {
    export type Interface = IApprovedReviewPublishRule;
    export type Params = ApprovedReviewPublishRuleParams;
    export type Error = RuleError;
    export type Return = Promise<Result<void, RuleError>>;
}

/*
 * The scheduler guards (CMS entries and Website Builder pages) refuse a scheduled publish with the
 * rule's errors; declared here so every user of the rule sees them.
 */
declare module "@webiny/api-scheduler/features/ScheduleAction/abstractions.js" {
    interface IScheduleActionErrors {
        /** A publish is scheduled only when publishing now is allowed. */
        publishBlocked: ReviewPublishBlockedError;
        /** The bound-workflow lookup failed; the schedule is refused (fail closed). */
        workflowPersistence: WorkflowPersistenceError;
        /** The review lookup failed; the schedule is refused (fail closed). */
        reviewPersistence: ReviewPersistenceError;
    }
}
