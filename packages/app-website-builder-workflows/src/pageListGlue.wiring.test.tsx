import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { createAbstraction } from "@webiny/feature/admin";
import { CompositionProvider } from "@webiny/react-composition";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/listPages/abstractions.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { PageListCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { TableRowMapper as TableRowMapperAbstraction } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/abstractions.js";
import { TableRowMapper as BaseTableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/TableRowMapper.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { toSystemWorkflow } from "@webiny/app-workflows/review/domain/toSystemWorkflow.js";
import type { IReviewCacheWriter } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";
import { ReviewCacheSyncHandler } from "@webiny/app-workflows/review/cache/ReviewCacheSyncHandler.js";
import { ReviewChangedEvent } from "@webiny/app-workflows/review/events/ReviewChangedEvent.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { createReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import "~/types.js";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: () => flags.enabled }) };
});

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/PagesList/index.js", () => {
    return { PagesList: () => null };
});

vi.mock("~/Components/ContentReviews/WbContentReviews.js", () => {
    return { WbContentReviews: () => null };
});

const createPage = (id: string, entryId: string): Page => {
    return Page.create({ id, entryId, status: WbPageStatus.Draft });
};

/*
 * Stands in for another app's cache sync: its own subclass of the shared handler (R237), bound to
 * its own writer token.
 */
const OtherAppWriter = createAbstraction<IReviewCacheWriter>("Test/OtherAppReviewCacheWriter");

class OtherAppCacheSyncHandlerImpl
    extends ReviewCacheSyncHandler
    implements ReviewChangedHandler.Interface {}

const OtherAppCacheSyncHandler = ReviewChangedHandler.createImplementation({
    implementation: OtherAppCacheSyncHandlerImpl,
    dependencies: [OtherAppWriter]
});

const mountRoot = (enabled: boolean) => {
    flags.enabled = enabled;
    const listCache = new ListCache<Page>("entryId");
    const fullCache = new ListCache<Page>("id");
    listCache.addItems([createPage("page-1#0001", "page-1"), createPage("page-2#0001", "page-2")]);
    fullCache.addItems([createPage("page-1#0001", "page-1")]);

    const container = new Container();
    container.register(BaseTableRowMapper);
    container.registerInstance(PageListCache, listCache);
    container.registerInstance(FullPageCache, fullCache);

    render(
        <DiContainerProvider container={container}>
            <CompositionProvider>
                <WebsiteBuilderWorkflows />
            </CompositionProvider>
        </DiContainerProvider>
    );

    return { container, listCache, fullCache };
};

const createInProgressPage = (): Page => {
    return Page.create({
        id: "page-1#0001",
        entryId: "page-1",
        status: WbPageStatus.Draft,
        system: {
            workflow: {
                workflowId: "workflow-1",
                reviewState: ReviewState.InProgress,
                stepId: "step-1",
                stepName: "Legal",
                stepState: StepState.InReview
            }
        }
    });
};

describe("Website Builder page list glue from the composition root", () => {
    afterEach(() => {
        cleanup();
    });

    it("flag on: both field selections ask for system.workflow", () => {
        const { container } = mountRoot(true);

        const listSelections = container.resolveAll(ListPagesGraphQLFieldSelection);
        const getSelections = container.resolveAll(GetPageGraphQLFieldSelection);

        expect(listSelections).toHaveLength(1);
        expect(getSelections).toHaveLength(1);
        expect(listSelections[0].getSelection()[0]).toContain("reviewState");
        expect(getSelections[0].getSelection()[0]).toContain("reviewState");
    });

    it("flag on: rows of pages in review are not selectable", () => {
        const { container } = mountRoot(true);
        const mapper = container.resolve(TableRowMapperAbstraction);

        const row = mapper.fromPage(createInProgressPage());

        expect(row.$selectable).toBe(false);
    });

    it("flag on: a review change updates the page row through the shared handler and the writer", async () => {
        const { container, listCache, fullCache } = mountRoot(true);
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(1);
        const review = createReview({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            state: ReviewState.InProgress
        });
        const expected = toSystemWorkflow(review);
        expect(expected).not.toBeNull();

        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                review
            })
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        const other = listCache.getItems().find(page => page.entryId === "page-2");
        const full = fullCache.getItems().find(page => page.id === "page-1#0001");
        expect(home?.system?.workflow).toEqual(expected);
        expect(full?.system?.workflow).toEqual(expected);
        expect(other?.system).toBeNull();

        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                review: null
            })
        );

        const cleared = listCache.getItems().find(page => page.entryId === "page-1");
        expect(cleared?.system?.workflow).toBeNull();
    });

    it("flag on: another app's subclass of the shared handler coexists with this app's (R237)", async () => {
        const { container, listCache } = mountRoot(true);
        const otherWrite = vi.fn();
        const otherWriter: IReviewCacheWriter = {
            canHandle: namespace => namespace === "cms.article",
            write: otherWrite
        };
        container.registerInstance(OtherAppWriter, otherWriter);
        container.register(OtherAppCacheSyncHandler);
        const handlers = container.resolveAll(ReviewChangedHandler);
        expect(handlers).toHaveLength(2);
        const pageReview = createReview({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            state: ReviewState.InProgress
        });
        const entryReview = createReview({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            state: ReviewState.InProgress
        });

        for (const handler of handlers) {
            await handler.handle(
                new ReviewChangedEvent({
                    namespace: "wb.page",
                    targetId: "page-1",
                    targetRevisionId: "page-1#0001",
                    review: pageReview
                })
            );
        }
        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system?.workflow).toEqual(toSystemWorkflow(pageReview));
        expect(otherWrite).not.toHaveBeenCalled();

        for (const handler of handlers) {
            await handler.handle(
                new ReviewChangedEvent({
                    namespace: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    review: entryReview
                })
            );
        }
        expect(otherWrite).toHaveBeenCalledTimes(1);
        const stillHome = listCache.getItems().find(page => page.entryId === "page-1");
        expect(stillHome?.system?.workflow).toEqual(toSystemWorkflow(pageReview));
    });

    it("flag on: a review of another namespace is ignored", async () => {
        const { container, listCache } = mountRoot(true);
        const handlers = container.resolveAll(ReviewChangedHandler);
        const review = createReview({
            namespace: "cms.article",
            targetId: "page-1",
            targetRevisionId: "page-1#0001"
        });

        await handlers[0].handle(
            new ReviewChangedEvent({
                namespace: "cms.article",
                targetId: "page-1",
                targetRevisionId: "page-1#0001",
                review
            })
        );

        const home = listCache.getItems().find(page => page.entryId === "page-1");
        expect(home?.system).toBeNull();
    });

    it("flag off: nothing is registered and rows stay selectable", () => {
        const { container } = mountRoot(false);

        expect(container.resolveAll(ListPagesGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(GetPageGraphQLFieldSelection)).toHaveLength(0);
        expect(container.resolveAll(ReviewChangedHandler)).toHaveLength(0);
        const mapper = container.resolve(TableRowMapperAbstraction);
        const row = mapper.fromPage(createInProgressPage());
        expect(row.$selectable).toBe(true);
    });
});
