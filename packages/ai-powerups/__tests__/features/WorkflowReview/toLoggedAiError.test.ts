import { describe, expect, it } from "vitest";
import { toLoggedAiError } from "~/api/features/WorkflowReview/toLoggedAiError.js";

describe("toLoggedAiError", () => {
    it("keeps the name, the message and a numeric status code, nothing else", () => {
        const error = Object.assign(new Error("Too many requests"), {
            name: "AI_APICallError",
            statusCode: 429,
            requestBodyValues: { prompt: "content" }
        });

        expect(toLoggedAiError(error)).toEqual({
            name: "AI_APICallError",
            message: "Too many requests",
            statusCode: 429
        });
    });

    it("redacts key-like text in the message and keeps the rest readable", () => {
        const cases: [string, string][] = [
            [
                "Incorrect API key provided: sk-proj-AbC123xyz",
                "Incorrect API key provided: [redacted]"
            ],
            ["invalid x-api-key sk-ant-api03-ZZZ999", "invalid x-api-key [redacted]"],
            ["API key not valid: AIzaSyA1234567890abcdefghijk", "API key not valid: [redacted]"],
            ["header was Bearer abc.def.ghi, refused", "header was [redacted], refused"],
            [`token ${"a1".repeat(25)} expired`, "token [redacted] expired"]
        ];

        for (const [message, expected] of cases) {
            expect(toLoggedAiError(new Error(message)).message).toBe(expected);
        }
    });

    it("leaves a message without secrets unchanged", () => {
        expect(toLoggedAiError(new Error("The model is overloaded (529).")).message).toBe(
            "The model is overloaded (529)."
        );
    });

    it("logs a thrown non-error as its text, redacted", () => {
        expect(toLoggedAiError("failed with sk-live-123456789")).toEqual({
            name: "Error",
            message: "failed with [redacted]"
        });
    });
});
