import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { createFakeNotifications } from "~/review/testing/createFakeNotifications.js";
import type { FakeNotifications } from "~/review/testing/createFakeNotifications.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewActivity as ReviewActivityToken } from "~/review/activity/abstractions.js";
import type { ReviewActivitySignal } from "~/review/activity/abstractions.js";
import { ReviewActivity } from "~/review/activity/ReviewActivity.js";
import { ReviewNotificationService as ReviewNotificationServiceToken } from "./abstractions.js";
import type { WorkflowsNotificationData } from "./abstractions.js";
import { ReviewNotificationService } from "./ReviewNotificationService.js";

const createData = (
    overrides: Partial<WorkflowsNotificationData> = {}
): WorkflowsNotificationData => {
    return {
        event: "assigned",
        reviewId: "review-1",
        stepId: "step-1",
        namespace: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "A review is waiting for you",
        body: "Draft check on “Launch article”.",
        ...overrides
    };
};

describe("ReviewNotificationService", () => {
    let notifications: FakeNotifications;
    let service: ReviewNotificationServiceToken.Interface;
    let signals: ReviewActivitySignal[];

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewActivity).inSingletonScope();
        container.register(ReviewNotificationService).inSingletonScope();
        service = container.resolve(ReviewNotificationServiceToken);
        signals = [];
        container.resolve(ReviewActivityToken).subscribe(["cms.article", "wb.page"], signal => {
            signals.push(signal);
        });
    });

    it("shows the notification bottom right for 8 seconds with a close button", () => {
        service.handle({ data: createData(), url: null });

        expect(notifications.notify).toHaveBeenCalledTimes(1);
        const input: INotificationInput = notifications.notify.mock.calls[0][0];
        expect(input.title).toBe("A review is waiting for you");
        expect(input.description).toBe("Draft check on “Launch article”.");
        expect(input.position).toBe("bottom-right");
        expect(input.duration).toBe(8000);
        expect(input.dismissible).toBe(true);
        expect(input).not.toHaveProperty("link");
    });

    it("adds an Open content link only when a URL is passed", () => {
        service.handle({
            data: createData(),
            url: "/cms/content-entries/article?id=entry-1%230001"
        });

        const input: INotificationInput = notifications.notify.mock.calls[0][0];
        expect(input.link).toEqual({
            label: "Open content",
            url: "/cms/content-entries/article?id=entry-1%230001"
        });
    });

    it("signals the activity bus with a remote source, the namespace, the review id and the revision id of the message", () => {
        service.handle({ data: createData({ namespace: "wb.page" }), url: null });

        expect(signals).toEqual([
            {
                namespace: "wb.page",
                source: "remote",
                reviewId: "review-1",
                targetRevisionId: "entry-1#0001"
            }
        ]);
    });

    it("shows every event kind the same way", () => {
        service.handle({ data: createData({ event: "rejected", title: "Rejected" }), url: null });
        service.handle({ data: createData({ event: "cancelled", title: "Cancelled" }), url: null });

        expect(notifications.notify).toHaveBeenCalledTimes(2);
        expect(signals).toHaveLength(2);
    });

    it("never uses the success variant (those are own-action toasts)", () => {
        service.handle({ data: createData(), url: null });

        expect(notifications.success).not.toHaveBeenCalled();
    });
});
