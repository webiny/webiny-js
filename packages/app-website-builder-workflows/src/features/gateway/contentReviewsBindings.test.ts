import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { CmsReviewContentAdapter } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewContentAdapter/abstractions.js";
import { CmsReviewNotificationHandler } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewNotificationHandler.js";
import { CmsReviewRowProvider as CmsRowProviderAbstraction } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewRowProvider/abstractions.js";
import { CmsReviewRowProvider } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewRowProvider/CmsReviewRowProvider.js";
import type { IReviewContentAdapter } from "@webiny/app-workflows/review/content/IReviewContentAdapter.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
import { CmsReviewChangeMessageHandler } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewChangeMessageHandler.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
import { WbReviewFeature } from "./feature.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider/abstractions.js";

const handle = vi.fn();
const notify = vi.fn();

// The leaf dependency of Task 12's gateway (the fake its feature test registers) and the shared
// service the handler reports to.
const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    container.registerInstance(ReviewNotificationService, { handle });
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify });
    return container;
};

const message = (namespace: string) => {
    return new WebsocketEvent({
        action: WORKFLOWS_NOTIFICATION_ACTION,
        data: {
            event: "assigned",
            reviewId: "review-1",
            stepId: "step-1",
            namespace,
            targetId: "page-1",
            targetRevisionId: "page-1#0001",
            title: "Review assigned",
            body: "Maja Kos asked you to review Home"
        }
    });
};

const changeMessage = (namespace: string) => {
    return new WebsocketEvent({
        action: WORKFLOWS_REVIEW_CHANGED_ACTION,
        data: {
            kind: "stepStarted",
            reviewId: "review-1",
            stepId: "step-1",
            namespace,
            targetId: "page-1",
            targetRevisionId: "page-1#0001"
        }
    });
};

describe("WbReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
        notify.mockReset();
    });

    it("registers a row provider that binds only the page namespace", () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const provider = container.resolve(WbReviewRowProvider);

        expect(provider).toBeInstanceOf(AppReviewRowProvider);
        expect(provider.getBinding("wb.page")).not.toBeNull();
        expect(provider.getBinding("cms.article")).toBeNull();
    });

    it("hands out the same provider as the feature export", () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const { rowProvider } = WbReviewFeature.resolve(container);

        expect(rowProvider).toBe(container.resolve(WbReviewRowProvider));
    });

    it("registers a notification handler that handles page messages and ignores cms messages (R223)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewNotificationHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(message("wb.page"));
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle.mock.calls[0][0].data.namespace).toBe("wb.page");
        expect(handle.mock.calls[0][0].url).toContain("/website-builder/pages/editor/");

        await own[0].handle(message("cms.article"));
        expect(handle).toHaveBeenCalledTimes(1);
    });

    it("coexists with the CMS bindings in one container, each binding only its own namespace (R237)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);
        const cmsAdapter: IReviewContentAdapter = {
            canHandle: namespace => namespace.startsWith("cms."),
            getContentUrl: () => "/cms/content-entries/article?id=entry-1%230001",
            getContentTypeLabel: () => null,
            renderContentTypeIcon: () => null
        };
        container.registerInstance(CmsReviewContentAdapter, cmsAdapter);
        container.register(CmsReviewRowProvider).inSingletonScope();
        container.register(CmsReviewNotificationHandler);

        const wbProvider = container.resolve(WbReviewRowProvider);
        const cmsProvider = container.resolve(CmsRowProviderAbstraction);

        expect(cmsProvider).not.toBe(wbProvider);
        expect(wbProvider.getBinding("wb.page")).not.toBeNull();
        expect(wbProvider.getBinding("cms.article")).toBeNull();
        expect(cmsProvider.getBinding("cms.article")).not.toBeNull();
        expect(cmsProvider.getBinding("wb.page")).toBeNull();

        const handlers = container
            .resolveAll(WebsocketEventHandler)
            .filter(handler => handler instanceof ReviewNotificationHandler);
        expect(handlers).toHaveLength(2);

        for (const handler of handlers) {
            await handler.handle(message("wb.page"));
        }
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle.mock.calls[0][0].url).toContain("/website-builder/pages/editor/");

        for (const handler of handlers) {
            await handler.handle(message("cms.article"));
        }
        expect(handle).toHaveBeenCalledTimes(2);
        expect(handle.mock.calls[1][0].url).toBe("/cms/content-entries/article?id=entry-1%230001");
    });

    it("registers a change message handler that signals page frames and ignores cms frames (R260)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewChangeMessageHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(changeMessage("wb.page"));
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({
            namespace: "wb.page",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "page-1#0001"
        });

        await own[0].handle(changeMessage("cms.article"));
        expect(notify).toHaveBeenCalledTimes(1);
        expect(handle).not.toHaveBeenCalled();
    });

    it("coexists with the CMS change message handler, each signalling only its own namespace (R237)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);
        const cmsAdapter: IReviewContentAdapter = {
            canHandle: namespace => namespace.startsWith("cms."),
            getContentUrl: () => "/cms/content-entries/article?id=entry-1%230001",
            getContentTypeLabel: () => null,
            renderContentTypeIcon: () => null
        };
        container.registerInstance(CmsReviewContentAdapter, cmsAdapter);
        container.register(CmsReviewChangeMessageHandler);

        const handlers = container
            .resolveAll(WebsocketEventHandler)
            .filter(handler => handler instanceof ReviewChangeMessageHandler);
        expect(handlers).toHaveLength(2);

        for (const handler of handlers) {
            await handler.handle(changeMessage("wb.page"));
        }
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify.mock.calls[0][0].namespace).toBe("wb.page");

        for (const handler of handlers) {
            await handler.handle(changeMessage("cms.article"));
        }
        expect(notify).toHaveBeenCalledTimes(2);
        expect(notify.mock.calls[1][0].namespace).toBe("cms.article");
    });
});
