import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { toContentTypes } from "./toContentTypes.js";

describe("toContentTypes", () => {
    it("keeps a model with no tags", () => {
        const result = toContentTypes([{ modelId: "article", name: "Article" }]);

        expect(result).toEqual([{ modelId: "article", name: "Article" }]);
    });

    it("drops singleton models, which cannot be bound to a workflow", () => {
        const result = toContentTypes([
            { modelId: "article", name: "Article" },
            { modelId: "settings", name: "Settings", tags: ["singleEntry"] },
            { modelId: "banner", name: "Banner", tags: ["singleEntry", "$publishing:true"] }
        ]);

        expect(result).toEqual([{ modelId: "article", name: "Article" }]);
    });
});
