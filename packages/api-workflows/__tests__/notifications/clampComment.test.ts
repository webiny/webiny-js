import { describe, expect, it } from "vitest";
import { clampComment } from "~/domain/notifications/clampComment.js";
import { NOTIFICATION_COMMENT_MAX_LENGTH } from "~/domain/notifications/constants.js";

describe("clampComment (R189a)", () => {
    it("leaves a short comment alone", () => {
        expect(clampComment("The hero image is missing alt text.")).toBe(
            "The hero image is missing alt text."
        );
    });

    it("trims the comment", () => {
        expect(clampComment("  Fix the title.\n")).toBe("Fix the title.");
    });

    it("leaves a comment of exactly the maximum length alone", () => {
        const comment = "a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH);

        expect(clampComment(comment)).toBe(comment);
    });

    it("cuts a longer comment so the result, with the ellipsis, is the maximum length", () => {
        const comment = "a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH + 1);

        const clamped = clampComment(comment);

        expect(clamped).toBe(`${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 1)}…`);
        expect(Array.from(clamped)).toHaveLength(NOTIFICATION_COMMENT_MAX_LENGTH);
    });

    it("drops the whitespace left at the cut before the ellipsis", () => {
        const comment = `${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 3)}   ${"b".repeat(50)}`;

        expect(clampComment(comment)).toBe(`${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 3)}…`);
    });

    it("counts code points and never splits an emoji", () => {
        const comment = `${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 2)}😀😀😀`;

        const clamped = clampComment(comment);

        expect(clamped).toBe(`${"a".repeat(NOTIFICATION_COMMENT_MAX_LENGTH - 2)}😀…`);
        expect(Array.from(clamped)).toHaveLength(NOTIFICATION_COMMENT_MAX_LENGTH);
    });

    it("leaves newlines and markup in the comment alone (escaping is the transport's job)", () => {
        expect(clampComment('Line one\n<b>"two"</b>')).toBe('Line one\n<b>"two"</b>');
    });
});
