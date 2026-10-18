import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { createEntry } from "~/testing/createEntry.js";
import { MODEL } from "~/testing/models.js";
import { getCmsEntryReviewInitParams } from "./getCmsEntryReviewInitParams.js";

describe("getCmsEntryReviewInitParams", () => {
    it("builds the target, the context and carries the use cases and the reloader", () => {
        const useCases = createFakeUseCases();
        const contentReloader: IReviewContentReloader = { reload: vi.fn() };

        const params = getCmsEntryReviewInitParams({
            model: MODEL,
            entry: createEntry({ status: "published" }),
            useCases,
            canRequest: true,
            contentReloader
        });

        expect(params.useCases).toBe(useCases);
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
