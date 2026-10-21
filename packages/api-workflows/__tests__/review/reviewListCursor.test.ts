import { describe, expect, it } from "vitest";
import {
    decodeReviewListCursor,
    encodeReviewListCursor
} from "~/features/review/ListReviews/reviewListCursor.js";

const toBase64 = (value: unknown): string => {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
};

const AT = "2026-10-09T10:02:00.000Z";

describe("review list cursor (R92)", () => {
    it("round-trips the time and the ids examined at it", () => {
        for (const cursor of [
            { lastChangedOn: AT, ids: ["r1"] },
            { lastChangedOn: AT, ids: ["r1", "r2"] }
        ]) {
            expect(decodeReviewListCursor(encodeReviewListCursor(cursor))).toEqual(cursor);
        }
    });

    it("encodes base64 JSON of { lastChangedOn, ids }", () => {
        expect(encodeReviewListCursor({ lastChangedOn: AT, ids: ["r1"] })).toBe(
            toBase64({ lastChangedOn: AT, ids: ["r1"] })
        );
    });

    it("refuses anything else", () => {
        for (const value of [
            "not-a-cursor",
            "",
            toBase64([]),
            toBase64(null),
            toBase64({ after: null, skip: 0 }),
            toBase64({ lastChangedOn: "", ids: [] }),
            toBase64({ lastChangedOn: 5, ids: [] }),
            toBase64({ lastChangedOn: AT }),
            toBase64({ lastChangedOn: AT, ids: "r1" }),
            toBase64({ lastChangedOn: AT, ids: [1] })
        ]) {
            expect(decodeReviewListCursor(value)).toBeNull();
        }
    });
});
