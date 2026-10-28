import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { WebsocketEvent } from "@webiny/app-websockets/events/WebsocketEvent.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import type { ReviewActivitySignal } from "~/review/activity/abstractions.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "~/review/domain/constants.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "~/review/domain/constants.js";
import type { WorkflowReviewChangedData } from "~/review/notifications/abstractions.js";
import { ReviewChangeMessageHandler } from "./ReviewChangeMessageHandler.js";

const data: WorkflowReviewChangedData = {
    kind: "stepStarted",
    reviewId: "review-1",
    stepId: "step-1",
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002"
};

const createAdapter = (prefix: string): IReviewContentAdapter => {
    return {
        canHandle: namespace => namespace.startsWith(prefix),
        getContentUrl: vi.fn(() => "/never-used"),
        getContentTypeLabel: () => null,
        renderContentTypeIcon: () => null
    };
};

interface TestActivity extends ReviewActivity.Interface {
    notify: Mock<(signal: ReviewActivitySignal) => void>;
}

const createActivity = (): TestActivity => {
    return { subscribe: vi.fn(), notify: vi.fn<(signal: ReviewActivitySignal) => void>() };
};

const setup = () => {
    const activity = createActivity();
    const adapter = createAdapter("cms.");
    const handler = new ReviewChangeMessageHandler(activity, adapter);
    return { activity, adapter, handler };
};

describe("ReviewChangeMessageHandler", () => {
    it("ignores an action that is not a review change", async () => {
        const { activity, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: "aco.folder.created", data }));
        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_NOTIFICATION_ACTION, data }));

        expect(activity.notify).not.toHaveBeenCalled();
    });

    it("ignores a malformed message without data or namespace", async () => {
        const { activity, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION }));
        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                data: { reviewId: "review-1" }
            })
        );

        expect(activity.notify).not.toHaveBeenCalled();
    });

    it("ignores a namespace its app cannot handle (each app ignores the other's messages)", async () => {
        const { activity, handler } = setup();

        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                data: { ...data, namespace: "wb.page" }
            })
        );

        expect(activity.notify).not.toHaveBeenCalled();
    });

    it("signals the activity bus with a remote source and the review and revision ids (R260)", async () => {
        const { activity, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION, data }));

        expect(activity.notify).toHaveBeenCalledTimes(1);
        expect(activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0002"
        });
    });

    it("shows nothing and asks the adapter for no URL (the message is silent, R253)", async () => {
        const { adapter, handler } = setup();

        await handler.handle(new WebsocketEvent({ action: WORKFLOWS_REVIEW_CHANGED_ACTION, data }));

        expect(adapter.getContentUrl).not.toHaveBeenCalled();
    });

    it("turns a missing review or revision id into null", async () => {
        const { activity, handler } = setup();

        await handler.handle(
            new WebsocketEvent({
                action: WORKFLOWS_REVIEW_CHANGED_ACTION,
                data: { namespace: "cms.article", kind: "stepStarted" }
            })
        );

        expect(activity.notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: null,
            targetRevisionId: null
        });
    });
});
