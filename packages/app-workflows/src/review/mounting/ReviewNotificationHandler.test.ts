import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "~/review/domain/constants.js";
import type { WorkflowsNotificationData } from "~/review/notifications/abstractions.js";
import type { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import { ReviewNotificationHandler } from "./ReviewNotificationHandler.js";

const data: WorkflowsNotificationData = {
    event: "assigned",
    reviewId: "review-1",
    stepId: "step-1",
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002",
    title: "Review assigned",
    body: "Maja Kos asked you to review Spring launch"
};

const setup = () => {
    const handle = vi.fn();
    const service: ReviewNotificationService.Interface = { handle };
    const adapter: IReviewContentAdapter = {
        canHandle: namespace => namespace.startsWith("cms."),
        getContentUrl: vi.fn(ref => `/cms/content-entries/article?id=${ref.targetRevisionId}`),
        getContentTypeLabel: () => null,
        renderContentTypeIcon: () => null
    };
    const handler = new ReviewNotificationHandler(service, adapter);
    return { handle, adapter, handler };
};

describe("ReviewNotificationHandler", () => {
    it("ignores an action that is not a workflows notification", async () => {
        const { handle, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: "aco.folder.created", data }));

        expect(handle).not.toHaveBeenCalled();
    });

    it("ignores a malformed message without data or namespace", async () => {
        const { handle, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION }));
        await handler.handle(
            new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data: { title: "x" } })
        );

        expect(handle).not.toHaveBeenCalled();
    });

    it("ignores a namespace its app cannot handle (each app ignores the other's messages)", async () => {
        const { handle, handler } = setup();

        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_NOTIFICATION_ACTION,
                data: { ...data, namespace: "wb.page" }
            })
        );

        expect(handle).not.toHaveBeenCalled();
    });

    it("passes a matching message to the service with the adapter's URL", async () => {
        const { handle, adapter, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data }));

        expect(adapter.getContentUrl).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            contentTypeId: null
        });
        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith({
            data,
            url: "/cms/content-entries/article?id=entry-1#0002"
        });
    });

    it("does not throw when the service throws", async () => {
        const { handle, handler } = setup();
        handle.mockImplementation(() => {
            throw new Error("toast failed");
        });
        const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(
            handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data }))
        ).resolves.toBeUndefined();

        expect(error).toHaveBeenCalledTimes(1);
        error.mockRestore();
    });
});
