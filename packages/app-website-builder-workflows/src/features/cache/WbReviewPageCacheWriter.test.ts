import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import "~/types.js";
import { WbReviewPageCacheWriter as WriterAbstraction } from "./abstractions.js";
import { WbReviewPageCacheWriter } from "./WbReviewPageCacheWriter.js";

const WORKFLOW: SystemWorkflowValue = {
    workflowId: "workflow-1",
    reviewState: ReviewState.InProgress,
    stepId: "step-1",
    stepName: "Legal",
    stepState: StepState.InReview
};

const createPage = (id: string, entryId: string, title: string): Page => {
    return Page.create({
        id,
        entryId,
        status: WbPageStatus.Draft,
        properties: { title }
    });
};

// A deep copy, so that a write that changes the cached objects in place is still seen.
const snapshot = (cache: ListCache<Page>): unknown => {
    return JSON.parse(JSON.stringify(cache.getItems()));
};

describe("WbReviewPageCacheWriter", () => {
    let listCache: ListCache<Page>;
    let fullCache: ListCache<Page>;
    let writer: WriterAbstraction.Interface;

    beforeEach(() => {
        listCache = new ListCache<Page>("entryId");
        fullCache = new ListCache<Page>("id");
        listCache.addItems([
            createPage("page-1#0002", "page-1", "Home"),
            createPage("page-2#0001", "page-2", "About")
        ]);
        fullCache.addItems([
            createPage("page-1#0002", "page-1", "Home"),
            createPage("page-1#0001", "page-1", "Home old")
        ]);

        const container = new Container();
        container.registerInstance(PageListCache, listCache);
        container.registerInstance(FullPageCache, fullCache);
        container.register(WbReviewPageCacheWriter);
        writer = container.resolve(WriterAbstraction);
    });

    it("handles only the Website Builder page namespace", () => {
        expect(writer.canHandle("wb.page")).toBe(true);
        expect(writer.canHandle("cms.article")).toBe(false);
    });

    it("puts the workflow on the matching revision in both caches and nothing else", () => {
        writer.write(
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0002" },
            WORKFLOW
        );

        const listItems = listCache.getItems();
        const home = listItems.find(page => page.entryId === "page-1");
        const about = listItems.find(page => page.entryId === "page-2");
        expect(home?.system?.workflow).toEqual(WORKFLOW);
        expect(about?.system).toBeNull();

        const fullItems = fullCache.getItems();
        const latest = fullItems.find(page => page.id === "page-1#0002");
        const older = fullItems.find(page => page.id === "page-1#0001");
        expect(latest?.system?.workflow).toEqual(WORKFLOW);
        expect(older?.system).toBeNull();
    });

    it("a review of an older revision does not mark the latest row", () => {
        writer.write(
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0001" },
            WORKFLOW
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system).toBeNull();
        const older = fullCache.getItems().find(page => page.id === "page-1#0001");
        expect(older?.system?.workflow).toEqual(WORKFLOW);
    });

    it("clears the workflow with null", () => {
        const ref = { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0002" };
        writer.write(ref, WORKFLOW);

        writer.write(ref, null);

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system?.workflow).toBeNull();
        const latest = fullCache.getItems().find(page => page.id === "page-1#0002");
        expect(latest?.system?.workflow).toBeNull();
    });

    it("keeps the other fields of the page and is a no-op for a page that is not cached", () => {
        const listBefore = snapshot(listCache);
        const fullBefore = snapshot(fullCache);

        writer.write(
            { namespace: "wb.page", targetId: "page-9", targetRevisionId: "page-9#0001" },
            WORKFLOW
        );

        expect(snapshot(listCache)).toEqual(listBefore);
        expect(snapshot(fullCache)).toEqual(fullBefore);

        writer.write(
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0002" },
            WORKFLOW
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.properties.title).toBe("Home");
        expect(home?.id).toBe("page-1#0002");
    });
});
