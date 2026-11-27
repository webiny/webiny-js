import { describe, expect, it } from "vitest";
import { createCacheKey } from "@webiny/utils";
import { isPublishingEnabled } from "~/domain/contentModel/isPublishingEnabled.js";
import { createSingletonEntryId } from "~/domain/contentModel/createSingletonEntryId.js";

describe("singleton model helpers", () => {
    it("isPublishingEnabled: regular model unless $publishing:false", () => {
        expect(isPublishingEnabled({ tags: ["type:model"] })).toBe(true);
        expect(isPublishingEnabled({ tags: ["$publishing:false"] })).toBe(false);
    });

    it("isPublishingEnabled: singleton only with $publishing:true", () => {
        expect(isPublishingEnabled({ tags: ["singleEntry"] })).toBe(false);
        expect(isPublishingEnabled({ tags: ["singleEntry", "$publishing:true"] })).toBe(true);
    });

    it("createSingletonEntryId is stable per modelId", () => {
        expect(createSingletonEntryId({ modelId: "settings" })).toBe(createCacheKey("settings"));
    });
});
