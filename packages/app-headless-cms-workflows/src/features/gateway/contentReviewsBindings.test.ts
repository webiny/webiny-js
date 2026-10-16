import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import { AppReviewRowProvider } from "@webiny/app-workflows/review/mounting/AppReviewRowProvider.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
import { CmsReviewFeature } from "./feature.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider.js";

const handle = vi.fn();

// The leaf dependencies of Task 11's gateway and adapter (the `MainGraphQLClient` and `ModelsCache`
// registrations its feature test also makes; here `ModelsCache` is a stub because only the handler
// is under test) and the shared service the handler reports to.
const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, {
        execute: vi.fn()
    } as unknown as MainGraphQLClient.Interface);
    container.registerInstance(ModelsCache, {
        getItem: () => undefined,
        getItems: () => [],
        hasItems: () => true
    } as unknown as ModelsCache.Interface);
    container.registerInstance(ReviewNotificationService, { handle });
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
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Review assigned",
            body: "Maja Kos asked you to review Spring launch"
        }
    });
};

describe("CmsReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
    });

    it("registers a row provider that binds only cms namespaces", () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const provider = container.resolve(CmsReviewRowProvider);

        expect(provider).toBeInstanceOf(AppReviewRowProvider);
        expect(provider.getBinding("cms.article")).not.toBeNull();
        expect(provider.getBinding("wb.page")).toBeNull();
    });

    it("hands out the same provider as the feature export", () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const { rowProvider } = CmsReviewFeature.resolve(container);

        expect(rowProvider).toBe(container.resolve(CmsReviewRowProvider));
    });

    it("registers a notification handler that handles cms messages and ignores wb messages (R223)", async () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewNotificationHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(message("cms.article"));
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle.mock.calls[0][0].data.namespace).toBe("cms.article");
        expect(handle.mock.calls[0][0].url).toContain("/cms/content-entries/article");

        await own[0].handle(message("wb.page"));
        expect(handle).toHaveBeenCalledTimes(1);
    });
});
