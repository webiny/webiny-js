import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter.js";

interface RenderedIconProps {
    label: string;
    icon: React.ReactElement<{ icon?: unknown }>;
}

describe("CmsReviewContentAdapter", () => {
    const cache = new ListCache<CmsModel>("modelId");
    let adapter: AdapterAbstraction.Interface;

    beforeEach(() => {
        const article = { modelId: "article", name: "Article" } as CmsModel;
        cache.setItems([article]);

        const container = new Container();
        container.registerInstance(ModelsCache, cache);
        container.register(CmsReviewContentAdapter);
        adapter = container.resolve(AdapterAbstraction);
    });

    it("handles CMS namespaces only", () => {
        expect(adapter.canHandle("cms.article")).toBe(true);
        expect(adapter.canHandle("wb.page")).toBe(false);
        expect(adapter.canHandle("cms")).toBe(false);
        expect(adapter.canHandle("cms.article.extra")).toBe(false);
    });

    it("builds the entry URL from the content entries route with the revision id encoded", () => {
        const url = adapter.getContentUrl({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            contentTypeId: "article"
        });

        expect(url).toBe("/cms/content-entries/article?id=entry-1%230001");
    });

    it("throws for a namespace that is not a CMS one", () => {
        expect(() => {
            adapter.getContentUrl({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                contentTypeId: null
            });
        }).toThrow('Invalid app name: "wb.page".');
    });

    it("labels a content type with the model name", () => {
        expect(adapter.getContentTypeLabel("article")).toBe("Article");
    });

    it("returns null for an unknown or not yet loaded model", () => {
        expect(adapter.getContentTypeLabel("product")).toBeNull();

        cache.clear();

        expect(adapter.getContentTypeLabel("article")).toBeNull();
    });

    it("renders the model icon, or the fallback icon for a model without one", () => {
        cache.setItems([
            { modelId: "article", name: "Article", icon: "fas/star" } as CmsModel,
            { modelId: "plain", name: "Plain" } as CmsModel
        ]);

        const withIcon = adapter.renderContentTypeIcon("article");
        const fallback = adapter.renderContentTypeIcon("plain");

        if (!React.isValidElement<RenderedIconProps>(withIcon)) {
            throw new Error("The model icon is not an element.");
        }
        if (!React.isValidElement<RenderedIconProps>(fallback)) {
            throw new Error("The fallback icon is not an element.");
        }
        expect(withIcon.props.label).toBe("Article");
        expect(withIcon.props.icon.props.icon).toEqual(["fas", "star"]);
        expect(fallback.props.label).toBe("Plain");
        expect(fallback.props.icon.props.icon).toBeUndefined();
    });
});
