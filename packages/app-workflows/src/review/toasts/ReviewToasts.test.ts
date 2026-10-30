import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { createFakeNotifications } from "~/review/testing/createFakeNotifications.js";
import type { FakeNotifications } from "~/review/testing/createFakeNotifications.js";
import { ReviewToasts as ReviewToastsToken } from "./abstractions.js";
import { ReviewToasts } from "./ReviewToasts.js";

// The texts per kind are pinned in `getReviewToastText.test.ts`; this file pins the wiring only.
describe("ReviewToasts", () => {
    let notifications: FakeNotifications;
    let toasts: ReviewToastsToken.Interface;

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewToasts);
        toasts = container.resolve(ReviewToastsToken);
    });

    it("shows the text as a success toast bottom right for 8 seconds with a close button", () => {
        toasts.show({
            kind: "started",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        });

        expect(notifications.success).toHaveBeenCalledTimes(1);
        expect(notifications.success.mock.calls[0][0]).toEqual({
            title: "Started “Draft check”",
            description: "It’s now in Assigned to me.",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.notify).not.toHaveBeenCalled();
        expect(notifications.warning).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("adds the Open Content Reviews link when a reviews URL is passed", () => {
        toasts.show({
            kind: "started",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });

        const input = notifications.success.mock.calls[0][0];
        expect(input.link).toEqual({ label: "Open Content Reviews", url: "/cms/content-reviews" });
    });

    it("omits the description when the text has none", () => {
        toasts.show({
            kind: "tookOver",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        });

        const input = notifications.success.mock.calls[0][0];
        expect(input).not.toHaveProperty("description");
        expect(input.title).toBe("Took over “Draft check”");
    });

    it("follows the success toast with a fixed warning when the content was not updated (R266)", () => {
        toasts.show({
            kind: "approved",
            stepTitle: "Draft check",
            personName: null,
            nextStepTitle: null,
            reviewsUrl: "/cms/content-reviews",
            contentNotUpdated: true
        });

        expect(notifications.success).toHaveBeenCalledTimes(1);
        expect(notifications.warning).toHaveBeenCalledTimes(1);
        expect(notifications.warning.mock.calls[0][0]).toEqual({
            title: "The content was not updated",
            description:
                "The review was saved, but the content does not show it yet. Reload the content to see the change.",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
    });
});
