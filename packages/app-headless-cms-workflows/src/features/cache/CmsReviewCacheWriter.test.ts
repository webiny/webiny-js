import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { ContentEntriesCacheProvider as ContentEntriesCacheProviderImpl } from "@webiny/app-headless-cms/features/contentEntry/ContentEntriesCacheProvider.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { toSystemWorkflow } from "@webiny/app-workflows/review/domain/toSystemWorkflow.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import { ReviewChangedEvent } from "@webiny/app-workflows/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { createReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { CmsReviewCacheWriter as Abstraction } from "~/features/cache/abstractions.js";
import { CmsReviewCacheWriter } from "~/features/cache/CmsReviewCacheWriter.js";
import { CmsReviewCacheSyncHandler } from "~/features/cache/CmsReviewCacheSyncHandler.js";

const WORKFLOW: SystemWorkflowValue = {
    workflowId: "wf-1",
    reviewState: ReviewState.InProgress,
    stepId: "step-1",
    stepName: "Legal review",
    stepState: StepState.InReview
};

function createEntry(
    entryId: string,
    system: Record<string, unknown> | undefined,
    version = 1
): CmsContentEntry {
    return {
        id: `${entryId}#000${version}`,
        entryId,
        meta: { title: entryId, status: "draft", version: 1, locked: false, system }
    } as unknown as CmsContentEntry;
}

function getSystem(entry: CmsContentEntry | undefined): unknown {
    return (entry?.meta as unknown as { system?: unknown }).system;
}

let container: Container;

function seedCache(modelId: string, entries: CmsContentEntry[]): void {
    const provider = container.resolve(ContentEntriesCacheProvider);
    provider.get(modelId).setItems(entries);
}

function readCache(modelId: string, entryId: string): CmsContentEntry | undefined {
    const provider = container.resolve(ContentEntriesCacheProvider);
    return provider.get(modelId).getItem(entry => entry.entryId === entryId);
}

beforeEach(() => {
    container = new Container();
    container.register(ContentEntriesCacheProviderImpl).inSingletonScope();
    container.register(CmsReviewCacheWriter);
    container.register(CmsReviewCacheSyncHandler);
});

describe("CmsReviewCacheWriter", () => {
    it("handles CMS namespaces only", () => {
        const writer = container.resolve(Abstraction);

        expect(writer.canHandle("cms.article")).toBe(true);
        expect(writer.canHandle("wb.page")).toBe(false);
        expect(writer.canHandle("cms")).toBe(false);
    });

    it("writes meta.system.workflow into the matching entry only", () => {
        seedCache("article", [
            createEntry("entry-1", undefined),
            createEntry("entry-2", undefined)
        ]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            WORKFLOW
        );

        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: WORKFLOW });
        expect(getSystem(readCache("article", "entry-2"))).toBeUndefined();
    });

    it("keeps the other meta fields and the other system keys", () => {
        seedCache("article", [createEntry("entry-1", { other: "kept", workflow: null })]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            WORKFLOW
        );

        const entry = readCache("article", "entry-1");
        expect(getSystem(entry)).toEqual({ other: "kept", workflow: WORKFLOW });
        expect(entry?.meta.title).toBe("entry-1");
        expect(entry?.meta.status).toBe("draft");
    });

    it("clears the workflow when the review is gone", () => {
        seedCache("article", [createEntry("entry-1", { workflow: WORKFLOW })]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            null
        );

        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: null });
    });

    it("an older revision does not mark the latest row", () => {
        seedCache("article", [createEntry("entry-1", undefined, 2)]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            WORKFLOW
        );

        expect(getSystem(readCache("article", "entry-1"))).toBeUndefined();
    });

    it("does not touch the cache of another model", () => {
        seedCache("article", [createEntry("entry-1", undefined)]);
        seedCache("page", [createEntry("entry-1", undefined)]);
        const writer = container.resolve(Abstraction);

        writer.write(
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: "entry-1#0001" },
            WORKFLOW
        );

        expect(getSystem(readCache("page", "entry-1"))).toBeUndefined();
    });
});

describe("CmsReviewCacheSyncHandler", () => {
    function resolveHandler() {
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(1);
        return handlers[0];
    }

    it("is registered as a subclass of the shared handler", () => {
        const handler = resolveHandler();

        expect(handler.constructor.name).toBe("CmsReviewCacheSyncHandlerImpl");
    });

    it("stores toSystemWorkflow of the changed review", async () => {
        seedCache("article", [createEntry("entry-1", undefined)]);
        const review = createReview({ namespace: "cms.article" });
        const expected = toSystemWorkflow(review);
        const event = new ReviewChangedEvent({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review
        });

        await resolveHandler().handle(event);

        expect(expected).not.toBeNull();
        expect(expected?.workflowId).toBe(review.workflowId);
        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: expected });
    });

    it("clears the workflow when the event carries no review", async () => {
        seedCache("article", [createEntry("entry-1", { workflow: WORKFLOW })]);
        const event = new ReviewChangedEvent({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review: null
        });

        await resolveHandler().handle(event);

        expect(getSystem(readCache("article", "entry-1"))).toEqual({ workflow: null });
    });

    it("ignores another app's namespace", async () => {
        seedCache("article", [createEntry("entry-1", undefined)]);
        const event = new ReviewChangedEvent({
            namespace: "wb.page",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            review: createReview({ namespace: "wb.page" })
        });

        await resolveHandler().handle(event);

        expect(getSystem(readCache("article", "entry-1"))).toBeUndefined();
    });
});
