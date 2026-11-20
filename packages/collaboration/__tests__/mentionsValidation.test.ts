import { describe, it, expect } from "vitest";
import {
    createCollabThreadValidation,
    listCollabThreadsValidation,
    replyToCollabThreadValidation
} from "~/api/graphql/validation.js";
import { normalizeMentions } from "~/api/utils/mentions.js";
import { MAX_MENTION_ID_LENGTH, MAX_MENTIONS } from "~/shared/constants.js";

const ids = (count: number) => Array.from({ length: count }, (_, i) => `user-${i}`);

const createInput = (mentions: string[]) => {
    return {
        input: {
            contentType: "cms.entry",
            contentId: "article:entry-1",
            locator: "",
            type: "note",
            body: "Hello",
            mentions
        }
    };
};

describe("collaboration mentions validation", () => {
    it("accepts up to the maximum number of mentions", () => {
        expect(createCollabThreadValidation.safeParse(createInput(ids(MAX_MENTIONS))).success).toBe(
            true
        );
        expect(
            replyToCollabThreadValidation.safeParse({
                threadId: "t1",
                body: "Hi",
                mentions: ids(MAX_MENTIONS)
            }).success
        ).toBe(true);
    });

    it("rejects too many mentions", () => {
        expect(
            createCollabThreadValidation.safeParse(createInput(ids(MAX_MENTIONS + 1))).success
        ).toBe(false);
        expect(
            replyToCollabThreadValidation.safeParse({
                threadId: "t1",
                body: "Hi",
                mentions: ids(MAX_MENTIONS + 1)
            }).success
        ).toBe(false);
    });

    it("rejects empty and oversized mention ids", () => {
        expect(createCollabThreadValidation.safeParse(createInput([""])).success).toBe(false);
        expect(
            createCollabThreadValidation.safeParse(
                createInput(["x".repeat(MAX_MENTION_ID_LENGTH + 1)])
            ).success
        ).toBe(false);
    });

    it("bounds the list limit", () => {
        const where = { contentType: "cms.entry", contentId: "article:entry-1" };
        expect(listCollabThreadsValidation.safeParse({ where, limit: 100 }).success).toBe(true);
        expect(listCollabThreadsValidation.safeParse({ where }).success).toBe(true);
        expect(listCollabThreadsValidation.safeParse({ where, limit: 101 }).success).toBe(false);
        expect(listCollabThreadsValidation.safeParse({ where, limit: 0 }).success).toBe(false);
        expect(listCollabThreadsValidation.safeParse({ where, limit: 1.5 }).success).toBe(false);
    });
});

describe("normalizeMentions", () => {
    it("de-duplicates, drops invalid ids and caps the count", () => {
        const result = normalizeMentions([
            "a",
            "a",
            "",
            "x".repeat(MAX_MENTION_ID_LENGTH + 1),
            ...ids(MAX_MENTIONS + 5)
        ]);

        expect(result[0]).toBe("a");
        expect(result).toHaveLength(MAX_MENTIONS);
        expect(new Set(result).size).toBe(result.length);
    });

    it("handles missing mentions", () => {
        expect(normalizeMentions(undefined)).toEqual([]);
        expect(normalizeMentions(null)).toEqual([]);
    });
});
