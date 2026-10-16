import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";

export type ReviewActionErrorKind =
    | "conflict"
    | "validation"
    | "notAuthorized"
    | "notFound"
    | "generic";

const CONFLICT_CODES: string[] = [
    ReviewErrorCode.StepNotCurrent,
    ReviewErrorCode.InvalidState,
    ReviewErrorCode.NotOwner,
    ReviewErrorCode.AlreadyOwner,
    ReviewErrorCode.StepNotTakeable,
    ReviewErrorCode.StepNotReassignable,
    ReviewErrorCode.ReassignTargetInvalid,
    ReviewErrorCode.AlreadyActive
];

// R220: how a failed review action maps to dialog behaviour, by error code. Pure.
export const classifyReviewActionError = (error: unknown): ReviewActionErrorKind => {
    if (!(error instanceof GraphQLOperationError) || error.code === null) {
        return "generic";
    }
    if (CONFLICT_CODES.includes(error.code)) {
        return "conflict";
    }
    if (error.code === ReviewErrorCode.Validation) {
        return "validation";
    }
    if (error.code === ReviewErrorCode.NotAuthorized) {
        return "notAuthorized";
    }
    if (error.code === ReviewErrorCode.NotFound) {
        return "notFound";
    }
    return "generic";
};
