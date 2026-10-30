import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import type { ReviewActionErrorKind } from "./classifyReviewActionError.js";
import { GENERIC_ERROR } from "./reviewErrorMessages.js";
import { NOT_FOUND_ERROR } from "./reviewErrorMessages.js";

/*
 * The dialog-level text of a failed review call. A server rejection that is not classified
 * shows the server's own message; only a transport failure gets the "did not respond" text.
 * Pure.
 */
export const getActionErrorMessage = (
    kind: ReviewActionErrorKind,
    error: unknown,
    transportMessage: string = GENERIC_ERROR
): string => {
    if (kind === "notAuthorized") {
        return NO_ACCESS_MESSAGE;
    }
    if (kind === "notFound") {
        return NOT_FOUND_ERROR;
    }
    if (error instanceof GraphQLOperationError && error.message !== "") {
        return error.message;
    }
    return transportMessage;
};
