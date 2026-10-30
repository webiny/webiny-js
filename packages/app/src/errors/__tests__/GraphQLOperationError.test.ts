import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GraphQLOperationError } from "../GraphQLOperationError.js";
import { GraphQLOperationError as ExportedGraphQLOperationError } from "../index.js";

describe("GraphQLOperationError", () => {
    it("keeps the message, the code and the data", () => {
        const data = { reviews: [{ reviewId: "review-1", title: "Spring launch" }] };

        const error = new GraphQLOperationError({
            message: "This content has a review in progress.",
            code: "Workflows/Review/ActiveReviewOnTrash",
            data
        });

        expect(error.message).toBe("This content has a review in progress.");
        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toBe(data);
    });

    it("defaults code and data to null when they are omitted", () => {
        const error = new GraphQLOperationError({ message: "The request failed." });

        expect(error.code).toBeNull();
        expect(error.data).toBeNull();
    });

    it("defaults code and data to null when they are null or undefined", () => {
        const withNulls = new GraphQLOperationError({
            message: "The request failed.",
            code: null,
            data: null
        });
        const withUndefined = new GraphQLOperationError({
            message: "The request failed.",
            code: undefined,
            data: undefined
        });

        expect(withNulls.code).toBeNull();
        expect(withNulls.data).toBeNull();
        expect(withUndefined.code).toBeNull();
        expect(withUndefined.data).toBeNull();
    });

    it("keeps falsy data values that are not null or undefined", () => {
        const withZero = new GraphQLOperationError({ message: "m", data: 0 });
        const withEmptyString = new GraphQLOperationError({ message: "m", data: "" });
        const withFalse = new GraphQLOperationError({ message: "m", data: false });

        expect(withZero.data).toBe(0);
        expect(withEmptyString.data).toBe("");
        expect(withFalse.data).toBe(false);
    });

    it("is an Error with its own name and a stack", () => {
        const error = new GraphQLOperationError({ message: "The request failed." });

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(GraphQLOperationError);
        expect(error.name).toBe("GraphQLOperationError");
        expect(typeof error.stack).toBe("string");
        expect(String(error)).toBe("GraphQLOperationError: The request failed.");
    });

    it("is told apart from a plain Error by instanceof after a throw and catch", () => {
        let caught: unknown = null;
        try {
            throw new GraphQLOperationError({ message: "Nope", code: "Workflows/NotAuthorized" });
        } catch (error) {
            caught = error;
        }

        let plain: unknown = null;
        try {
            throw new Error("Nope");
        } catch (error) {
            plain = error;
        }

        expect(caught instanceof GraphQLOperationError).toBe(true);
        expect(plain instanceof GraphQLOperationError).toBe(false);
    });

    it("is exported from the errors barrel as the same class", () => {
        expect(ExportedGraphQLOperationError).toBe(GraphQLOperationError);
    });
});
