import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewErrorCode } from "~/review/domain/ReviewErrorCode.js";
import { classifyReviewActionError } from "./classifyReviewActionError.js";

const failure = (code: string | null): GraphQLOperationError => {
    return new GraphQLOperationError({ message: "Failed.", code });
};

describe("classifyReviewActionError", () => {
    it("classifies TargetSync as its own kind (R266: the review was saved)", () => {
        expect(classifyReviewActionError(failure(ReviewErrorCode.TargetSync))).toBe("targetSync");
    });

    it.each([
        ReviewErrorCode.StepNotCurrent,
        ReviewErrorCode.InvalidState,
        ReviewErrorCode.AlreadyActive
    ])("keeps %s a conflict (a restart of a step that is not failed is one)", code => {
        expect(classifyReviewActionError(failure(code))).toBe("conflict");
    });

    it("keeps the other kinds", () => {
        expect(classifyReviewActionError(failure(ReviewErrorCode.Validation))).toBe("validation");
        expect(classifyReviewActionError(failure(ReviewErrorCode.NotAuthorized))).toBe(
            "notAuthorized"
        );
        expect(classifyReviewActionError(failure(ReviewErrorCode.NotFound))).toBe("notFound");
        expect(classifyReviewActionError(failure(ReviewErrorCode.TargetLocked))).toBe("generic");
        expect(classifyReviewActionError(failure(null))).toBe("generic");
        expect(classifyReviewActionError(new Error("Network."))).toBe("generic");
    });
});
