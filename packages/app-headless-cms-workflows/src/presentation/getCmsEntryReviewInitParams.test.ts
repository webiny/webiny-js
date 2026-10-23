import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import { createEntry } from "~/testing/createEntry.js";
import { MODEL } from "~/testing/models.js";
import { getCmsEntryReviewInitParams } from "./getCmsEntryReviewInitParams.js";

describe("getCmsEntryReviewInitParams", () => {
    it("builds the target and the context and carries the reloader, no use cases (R353)", () => {
        const contentReloader: IReviewContentReloader = { reload: vi.fn() };
        const entry = createEntry({ status: "published" });

        const params = getCmsEntryReviewInitParams({
            model: MODEL,
            entry,
            canRequest: true,
            contentReloader
        });

        expect(params).not.toHaveProperty("useCases");
        expect(params.contentReloader).toBe(contentReloader);
        expect(params.target).toEqual({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });
        expect(params.targetTitle).toBe("Article: Hello");
        expect(params.canRequest).toBe(true);
        expect(params.isPublished).toBe(true);
        expect(params.isUnpublished).toBe(false);
    });
});
