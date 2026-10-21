import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { NO_ACCESS_MESSAGE } from "../noAccessMessage.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";
import { getActionErrorMessage } from "./getActionErrorMessage.js";
import { GENERIC_ERROR } from "./reviewErrorMessages.js";
import { NOT_FOUND_ERROR } from "./reviewErrorMessages.js";

const messageFor = (error: unknown, transportMessage?: string): string => {
    const kind = classifyReviewActionError(error);
    return getActionErrorMessage(kind, error, transportMessage);
};

describe("getActionErrorMessage", () => {
    it("shows the no-access sentence for a not authorized error", () => {
        const error = new GraphQLOperationError({
            message: "Nope.",
            code: ReviewErrorCode.NotAuthorized
        });
        expect(messageFor(error)).toBe(NO_ACCESS_MESSAGE);
    });

    it("shows the not found sentence for a missing review", () => {
        const error = new GraphQLOperationError({
            message: "Gone.",
            code: ReviewErrorCode.NotFound
        });
        expect(messageFor(error)).toBe(NOT_FOUND_ERROR);
        expect(NOT_FOUND_ERROR).toBe("This review no longer exists.");
    });

    it("shows the server message of an unclassified server rejection", () => {
        const locked = new GraphQLOperationError({
            message: "The target is locked by another review.",
            code: ReviewErrorCode.TargetLocked
        });
        const noCode = new GraphQLOperationError({ message: "Something specific." });

        expect(messageFor(locked)).toBe("The target is locked by another review.");
        expect(messageFor(noCode)).toBe("Something specific.");
    });

    it("falls back to the generic text for a transport error", () => {
        expect(messageFor(new Error("Network."))).toBe(GENERIC_ERROR);
        expect(messageFor(undefined)).toBe(GENERIC_ERROR);
        expect(GENERIC_ERROR).toBe(
            "The server did not respond, so nothing was changed. Try again."
        );
    });

    it("falls back to the generic text when the server message is empty", () => {
        const error = new GraphQLOperationError({
            message: "",
            code: ReviewErrorCode.TargetLocked
        });
        expect(messageFor(error)).toBe(GENERIC_ERROR);
    });

    it("uses the given transport message instead of the generic text", () => {
        expect(messageFor(new Error("Network."), "Try later.")).toBe("Try later.");
    });
});
