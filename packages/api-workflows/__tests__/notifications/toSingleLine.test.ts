import { describe, expect, it } from "vitest";
import { toSingleLine } from "~/domain/notifications/toSingleLine.js";

describe("toSingleLine (R193)", () => {
    it("turns CR, LF and CRLF into single spaces", () => {
        expect(toSingleLine("Rejected: A\r\nBcc: evil@webiny.test")).toBe(
            "Rejected: A Bcc: evil@webiny.test"
        );
        expect(toSingleLine("a\nb\rc")).toBe("a b c");
    });

    it("collapses runs of whitespace and trims", () => {
        expect(toSingleLine("  Review   of \t\t the \n\n page  ")).toBe("Review of the page");
    });

    it("leaves a one-line text unchanged", () => {
        expect(toSingleLine("Approved: Home page")).toBe("Approved: Home page");
        expect(toSingleLine("")).toBe("");
    });
});
