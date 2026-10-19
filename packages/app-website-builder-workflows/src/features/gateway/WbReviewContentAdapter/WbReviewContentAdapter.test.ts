import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { WbReviewContentAdapter as AdapterAbstraction } from "./abstractions.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter.js";

describe("WbReviewContentAdapter", () => {
    let adapter: AdapterAbstraction.Interface;

    beforeEach(() => {
        const container = new Container();
        container.register(WbReviewContentAdapter);
        adapter = container.resolve(AdapterAbstraction);
    });

    it("handles the wb.page namespace only", () => {
        expect(adapter.canHandle("wb.page")).toBe(true);
        expect(adapter.canHandle("cms.article")).toBe(false);
        expect(adapter.canHandle("wb")).toBe(false);
    });

    it("builds the page editor URL from the editor route with the revision id encoded", () => {
        const url = adapter.getContentUrl({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            contentTypeId: null
        });

        expect(url).toBe("/website-builder/pages/editor/page-1%230001");
    });

    it("throws for a namespace that is not wb.page", () => {
        expect(() => {
            adapter.getContentUrl({
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                contentTypeId: "article"
            });
        }).toThrow('Invalid app name: "cms.article".');
    });

    it("has no content type label", () => {
        expect(adapter.getContentTypeLabel("page")).toBeNull();
    });
});
