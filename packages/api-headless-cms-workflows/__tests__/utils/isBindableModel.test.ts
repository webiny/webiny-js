import { describe, expect, it } from "vitest";
import { CMS_MODEL_PUBLISHING_DISABLED_TAG } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { isBindableModel } from "~/utils/isBindableModel.js";

describe("isBindableModel", () => {
    it("is false for a private model", () => {
        expect(isBindableModel({ isPrivate: true, tags: [] })).toBe(false);
    });

    it("is false for a model tagged as unpublishable", () => {
        expect(
            isBindableModel({ isPrivate: false, tags: [CMS_MODEL_PUBLISHING_DISABLED_TAG] })
        ).toBe(false);
        expect(isBindableModel({ isPrivate: false, tags: ["$publishing:false"] })).toBe(false);
    });

    it("is true for a public model, with or without other tags", () => {
        expect(isBindableModel({ isPrivate: false, tags: [] })).toBe(true);
        expect(isBindableModel({ isPrivate: false, tags: ["type:model"] })).toBe(true);
        expect(isBindableModel({ isPrivate: undefined, tags: undefined })).toBe(true);
    });
});
