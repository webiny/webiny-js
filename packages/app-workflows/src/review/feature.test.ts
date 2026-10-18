import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewServicesFeature } from "./feature.js";
import { ReviewActivity } from "~/review/activity/abstractions.js";
import { ReviewToasts } from "~/review/toasts/abstractions.js";
import { ReviewNotificationService } from "~/review/notifications/abstractions.js";

const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    return container;
};

describe("ReviewServicesFeature", () => {
    it("registers the three services", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        expect(container.resolve(ReviewActivity)).toBeDefined();
        expect(container.resolve(ReviewToasts)).toBeDefined();
        expect(container.resolve(ReviewNotificationService)).toBeDefined();
    });

    it("registers them as singletons and resolves them", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);

        const first = ReviewServicesFeature.resolve(container);
        const second = ReviewServicesFeature.resolve(container);

        expect(first.activity).toBe(second.activity);
        expect(first.toasts).toBe(second.toasts);
        expect(first.notifications).toBe(second.notifications);
        expect(first.activity).toBe(container.resolve(ReviewActivity));
    });

    it("shares one activity bus between the notification service and its subscribers", () => {
        const container = createContainer();
        ReviewServicesFeature.register(container);
        const { activity, notifications } = ReviewServicesFeature.resolve(container);
        const listener = vi.fn();
        activity.subscribe(["cms.article"], listener);

        notifications.handle({
            data: {
                event: "assigned",
                reviewId: "review-1",
                stepId: "step-1",
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: "entry-1#0001",
                title: "A review is waiting for you",
                body: "Draft check."
            },
            url: null
        });

        expect(listener).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });
    });
});
