import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { NotificationsFeature } from "./feature.js";
import { Notifications } from "./abstractions.js";

const createNotifications = (): Notifications.Interface => {
    const container = new Container();
    NotificationsFeature.register(container);
    return container.resolve(Notifications);
};

describe("Notifications", () => {
    let notifications: Notifications.Interface;

    beforeEach(() => {
        notifications = createNotifications();
    });

    it("queues a plain notification with exactly its own fields", () => {
        notifications.notify({ title: "Saved", description: "All good." });

        expect(notifications.getNotifications()).toEqual([
            { id: "notification-1", variant: "default", title: "Saved", description: "All good." }
        ]);
    });

    it("queues success and warning notifications with their variant", () => {
        notifications.success({ title: "Done" });
        notifications.warning({ title: "Careful" });

        const queued = notifications.getNotifications();
        expect(queued.map(item => item.variant)).toEqual(["success", "warning"]);
        expect(queued.map(item => item.id)).toEqual(["notification-1", "notification-2"]);
    });

    it("queues an error notification with the error variant", () => {
        notifications.error({ title: "Failed", description: "Try again." });

        expect(notifications.getNotifications()).toEqual([
            { id: "notification-1", variant: "error", title: "Failed", description: "Try again." }
        ]);
    });

    it("keeps link, duration, position and dismissible on the queued notification", () => {
        notifications.success({
            title: "Requested",
            description: "Spring launch",
            link: { label: "Open Content Reviews", url: "/cms/content-reviews" },
            duration: 8000,
            position: "bottom-right",
            dismissible: true
        });

        expect(notifications.getNotifications()).toEqual([
            {
                id: "notification-1",
                variant: "success",
                title: "Requested",
                description: "Spring launch",
                link: { label: "Open Content Reviews", url: "/cms/content-reviews" },
                duration: 8000,
                position: "bottom-right",
                dismissible: true
            }
        ]);
    });

    it("removes a notification by id and leaves the others", () => {
        notifications.notify({ title: "One" });
        notifications.error({ title: "Two" });
        notifications.warning({ title: "Three" });

        notifications.remove("notification-2");

        expect(notifications.getNotifications().map(item => item.title)).toEqual(["One", "Three"]);
    });
});
