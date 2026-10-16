import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { AppReviewRowProvider } from "./AppReviewRowProvider.js";

const createAdapter = (): IReviewContentAdapter => {
    return {
        canHandle: namespace => namespace.startsWith("cms."),
        getContentUrl: vi.fn(ref => `/url/${ref.targetRevisionId}`),
        getContentTypeLabel: vi.fn(contentTypeId => `Label ${contentTypeId}`)
    };
};

describe("AppReviewRowProvider", () => {
    const useCases = { name: "cms" } as unknown as IReviewUseCases;

    it("binds only the namespaces the adapter handles (R206)", () => {
        const provider = new AppReviewRowProvider(useCases, createAdapter());

        expect(provider.getBinding("cms.article")).not.toBeNull();
        expect(provider.getBinding("wb.page")).toBeNull();
    });

    it("hands out the app's use cases and delegates links and labels to the adapter", () => {
        const adapter = createAdapter();
        const provider = new AppReviewRowProvider(useCases, adapter);

        const binding = provider.getBinding("cms.article");

        expect(binding).not.toBeNull();
        expect(binding?.useCases).toBe(useCases);
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
        const cms = new AppReviewRowProvider(useCases, createAdapter());
        const wbUseCases = { name: "wb" } as unknown as IReviewUseCases;
        const wb = new AppReviewRowProvider(wbUseCases, {
            canHandle: namespace => namespace === "wb.page",
            getContentUrl: () => "/wb",
            getContentTypeLabel: () => null
        });

        expect(cms.getBinding("wb.page")).toBeNull();
        expect(wb.getBinding("cms.article")).toBeNull();
        expect(wb.getBinding("wb.page")?.useCases).toBe(wbUseCases);
    });
});
