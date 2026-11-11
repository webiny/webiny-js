import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { toContentTypes } from "./toContentTypes.js";

describe("toContentTypes", () => {
    it("keeps a model with no tags", () => {
        const result = toContentTypes([{ modelId: "article", name: "Article" }]);

        expect(result).toEqual([{ modelId: "article", name: "Article" }]);
    });
});
