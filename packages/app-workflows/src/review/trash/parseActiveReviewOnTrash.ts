import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import type { ActiveReviewOnTrashData } from "~/review/domain/types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isBlockingReview(value: unknown): boolean {
    if (!isRecord(value)) {
        return false;
    }

    const hasStrings = [
        "reviewId",
        "model",
        "targetId",
        "targetRevisionId",
        "title",
        "stepName"
    ].every(key => typeof value[key] === "string");
    const hasNumbers = ["stepPosition", "stepCount"].every(key => typeof value[key] === "number");

    return hasStrings && hasNumbers;
}

function isActiveReviewOnTrashData(value: unknown): value is ActiveReviewOnTrashData {
    if (!isRecord(value)) {
        return false;
    }
    if (typeof value.model !== "string") {
        return false;
    }
    if (value.action !== "trash" && value.action !== "delete") {
        return false;
    }
    if (!Array.isArray(value.reviews) || value.reviews.length === 0) {
        return false;
    }

    return value.reviews.every(isBlockingReview);
}

/*
 * Returns the data of the server refusal `Workflows/Review/ActiveReviewOnTrash`, or `null` for any
 * other error, any other code and malformed data (R205: those are rethrown unchanged). Pure.
 */
export const parseActiveReviewOnTrash = (error: unknown): ActiveReviewOnTrashData | null => {
    if (!(error instanceof GraphQLOperationError)) {
        return null;
    }
    if (error.code !== ReviewErrorCode.ActiveReviewOnTrash) {
        return null;
    }
    if (!isActiveReviewOnTrashData(error.data)) {
        return null;
    }

    return error.data;
};
