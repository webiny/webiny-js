import { describe, expect, it } from "vitest";
import { isPublishingEnabled } from "./isPublishingEnabled.js";
import { isSingletonModel } from "./isSingletonModel.js";

describe("isPublishingEnabled", () => {
    it("is enabled for a regular model without tags", () => {
        expect(isPublishingEnabled({ tags: [] })).toBe(true);
    });

    it("is disabled for a regular model tagged $publishing:false", () => {
        expect(isPublishingEnabled({ tags: ["$publishing:false"] })).toBe(false);
    });

    it("is disabled for a singleton model by default", () => {
        expect(isPublishingEnabled({ tags: ["singleEntry"] })).toBe(false);
    });

    it("is enabled for a singleton model tagged $publishing:true", () => {
        expect(isPublishingEnabled({ tags: ["singleEntry", "$publishing:true"] })).toBe(true);
    });

    it("detects a singleton model", () => {
        expect(isSingletonModel({ tags: ["singleEntry"] })).toBe(true);
        expect(isSingletonModel({ tags: [] })).toBe(false);
    });
});
