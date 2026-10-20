import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { AppReviewRowProvider } from "./AppReviewRowProvider.js";

const createAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: namespace => namespace.startsWith("cms."),
        getContentUrl: vi.fn(ref => `/url/${ref.targetRevisionId}`),
        getContentTypeLabel: vi.fn(contentTypeId => `Label ${contentTypeId}`)
    };
};

describe("AppReviewRowProvider", () => {
    it("binds only the namespaces the adapter handles (R206)", () => {
        const provider = new AppReviewRowProvider(createAdapter());

        expect(provider.getBinding("cms.article")).not.toBeNull();
        expect(provider.getBinding("wb.page")).toBeNull();
    });

    it("delegates links and labels to the adapter and carries no use cases (R353)", () => {
        const adapter = createAdapter();
        const provider = new AppReviewRowProvider(adapter);

        const binding = provider.getBinding("cms.article");

        expect(binding).not.toBeNull();
        expect(binding).not.toHaveProperty("useCases");
        const ref = {
            namespace: "cms.article",
            targetId: "e1",
            targetRevisionId: "e1#0001",
            contentTypeId: "article"
        };
        expect(binding?.getContentUrl(ref)).toBe("/url/e1#0001");
        expect(adapter.getContentUrl).toHaveBeenCalledWith(ref);
        expect(binding?.getContentTypeLabel("article")).toBe("Label article");
    });

    it("keeps two providers on two adapters independent (R202)", () => {
        const cms = new AppReviewRowProvider(createAdapter());
        const wb = new AppReviewRowProvider({
            canHandle: namespace => namespace === "wb.page",
            getContentUrl: () => "/wb",
            getContentTypeLabel: () => null
        });

        expect(cms.getBinding("wb.page")).toBeNull();
        expect(wb.getBinding("cms.article")).toBeNull();
        const binding = wb.getBinding("wb.page");
        expect(binding).not.toBeNull();
        expect(binding).not.toHaveProperty("useCases");
    });
});
