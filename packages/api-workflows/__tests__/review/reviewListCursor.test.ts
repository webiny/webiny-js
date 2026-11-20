import { describe, expect, it } from "vitest";
import {
    decodeReviewListCursor,
    encodeReviewListCursor,
    type ReviewListCursor
} from "~/features/review/ListReviews/reviewListCursor.js";

const toBase64 = (value: unknown): string => {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
};

const AT = "2026-10-09T10:02:00.000Z";

describe("review list cursor (R92, B2 design 2)", () => {
    it("round-trips the sort, the value and the ids examined at it", () => {
        const cursors: ReviewListCursor[] = [
            { sort: "lastChangedOn_ASC", value: AT, ids: ["r1"] },
            { sort: "lastChangedOn_DESC", value: AT, ids: ["r1", "r2"] },
            { sort: "title_ASC", value: "spring launch", ids: ["r1"] },
            { sort: "title_DESC", value: "autumn sale", ids: ["r1", "r2"] },
            { sort: "title_ASC", value: "", ids: ["r1"] }
        ];
        for (const cursor of cursors) {
            expect(decodeReviewListCursor(encodeReviewListCursor(cursor))).toEqual(cursor);
        }
    });

    it("encodes base64 JSON of { sort, value, ids }", () => {
        expect(encodeReviewListCursor({ sort: "title_ASC", value: "a", ids: ["r1"] })).toBe(
            toBase64({ sort: "title_ASC", value: "a", ids: ["r1"] })
        );
    });

    it("refuses anything else", () => {
        for (const value of [
            "not-a-cursor",
            "",
            toBase64([]),
            toBase64(null),
            toBase64({ after: null, skip: 0 }),
            // The cursor before sorts were part of it.
            toBase64({ lastChangedOn: AT, ids: ["r1"] }),
            toBase64({ sort: "lastChangedOn_ASC", value: "", ids: [] }),
            toBase64({ sort: "lastChangedOn_DESC", value: 5, ids: [] }),
            toBase64({ sort: "title_ASC", value: "a" }),
            toBase64({ sort: "title_ASC", value: "a", ids: "r1" }),
            toBase64({ sort: "title_ASC", value: "a", ids: [1] }),
            toBase64({ sort: "createdOn_ASC", value: AT, ids: [] }),
            toBase64({ value: AT, ids: [] })
        ]) {
            expect(decodeReviewListCursor(value)).toBeNull();
        }
    });
});
