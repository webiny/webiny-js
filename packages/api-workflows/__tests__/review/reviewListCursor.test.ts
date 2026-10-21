import { describe, expect, it } from "vitest";
import {
    decodeReviewListCursor,
    encodeReviewListCursor
} from "~/features/review/ListReviews/reviewListCursor.js";

const toBase64 = (value: unknown): string => {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
};

describe("review list cursor (R92)", () => {
    it("round-trips the repository cursor and the examined rows", () => {
        for (const cursor of [
            { after: null, skip: 0 },
            { after: "eyJwYWdlIjoyfQ==", skip: 4 }
        ]) {
            expect(decodeReviewListCursor(encodeReviewListCursor(cursor))).toEqual(cursor);
        }
    });

    it("encodes base64 JSON of { after, skip }", () => {
        expect(encodeReviewListCursor({ after: "abc", skip: 2 })).toBe(
            toBase64({ after: "abc", skip: 2 })
        );
    });

    it("refuses anything else", () => {
        for (const value of [
            "not-a-cursor",
            "",
            toBase64([]),
            toBase64(null),
            toBase64({ after: 5, skip: 0 }),
            toBase64({ after: null }),
            toBase64({ after: null, skip: -1 }),
            toBase64({ after: null, skip: 1.5 }),
            toBase64({ after: null, skip: "2" })
        ]) {
            expect(decodeReviewListCursor(value)).toBeNull();
        }
    });
});
