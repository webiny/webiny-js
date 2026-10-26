import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { ReviewToasts as ReviewToastsToken } from "./abstractions.js";
import type { ReviewToastKind } from "./abstractions.js";
import type { ReviewToastParams } from "./abstractions.js";
import { ReviewToasts } from "./ReviewToasts.js";

type FakeNotifications = { [K in keyof Notifications.Interface]: Mock };

const createFakeNotifications = (): FakeNotifications => {
    return {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    };
};

interface ToastCase {
    kind: ReviewToastKind;
    params: ReviewToastParams;
    title: string;
    description: string | null;
}

const toastCases: ToastCase[] = [
    {
        kind: "requested",
        params: { kind: "requested", stepTitle: "Draft check", personName: null, reviewsUrl: null },
        title: "Review requested",
        description: "Draft check is the first step."
    },
    {
        kind: "started",
        params: { kind: "started", stepTitle: "Draft check", personName: null, reviewsUrl: null },
        title: "Started “Draft check”",
        description: "It’s now in Assigned to me."
    },
    {
        kind: "restarted",
        params: {
            kind: "restarted",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        },
        title: "Restarted “Draft check”",
        description: "The step is running again."
    },
    {
        kind: "tookOver",
        params: {
            kind: "tookOver",
            stepTitle: "Draft check",
            personName: "Ada Lovelace",
            reviewsUrl: null
        },
        title: "Took over “Draft check”",
        description: "Ada Lovelace was notified."
    },
    {
        kind: "reassigned",
        params: {
            kind: "reassigned",
            stepTitle: "Draft check",
            personName: "Grace Hopper",
            reviewsUrl: null
        },
        title: "Reassigned “Draft check” to Grace Hopper",
        description: "Both the previous and the new owner are notified."
    },
    {
        kind: "approved",
        params: {
            kind: "approved",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null,
            nextStepTitle: "Legal check"
        },
        title: "Approved “Draft check”",
        description: "Next: Legal check."
    },
    {
        kind: "rejected",
        params: { kind: "rejected", stepTitle: "Draft check", personName: null, reviewsUrl: null },
        title: "Rejected “Draft check”",
        description: "The requester is notified."
    },
    {
        kind: "cancelled",
        params: { kind: "cancelled", stepTitle: null, personName: null, reviewsUrl: null },
        title: "Review cancelled",
        description: "Editing is unlocked."
    }
];

describe("ReviewToasts", () => {
    let notifications: FakeNotifications;
    let toasts: ReviewToastsToken.Interface;

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewToasts).inSingletonScope();
        toasts = container.resolve(ReviewToastsToken);
    });

    it.each(toastCases)(
        "$kind shows the QBZ-93 text bottom right for 8 seconds with a close button",
        toastCase => {
            toasts.show(toastCase.params);

            expect(notifications.success).toHaveBeenCalledTimes(1);
            const input: INotificationInput = notifications.success.mock.calls[0][0];
            expect(input.title).toBe(toastCase.title);
            expect(input.description).toBe(toastCase.description ?? undefined);
            expect(input.position).toBe("bottom-right");
            expect(input.duration).toBe(8000);
            expect(input.dismissible).toBe(true);
            expect(input).not.toHaveProperty("link");
        }
    );

    it.each(toastCases)("$kind uses only the success variant", toastCase => {
        toasts.show(toastCase.params);

        expect(notifications.notify).not.toHaveBeenCalled();
        expect(notifications.warning).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("adds the Open Content Reviews link only when a reviews URL is passed", () => {
        toasts.show({
            kind: "started",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });

        const input: INotificationInput = notifications.success.mock.calls[0][0];
        expect(input.link).toEqual({ label: "Open Content Reviews", url: "/cms/content-reviews" });
    });

    it("adds the Open Content Reviews link to the restarted toast in the editor and none on Content Reviews", () => {
        toasts.show({
            kind: "restarted",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: "/cms/content-reviews"
        });
        toasts.show({
            kind: "restarted",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        });

        const editor: INotificationInput = notifications.success.mock.calls[0][0];
        const list: INotificationInput = notifications.success.mock.calls[1][0];
        expect(editor.link).toEqual({
            label: "Open Content Reviews",
            url: "/cms/content-reviews"
        });
        expect(list).not.toHaveProperty("link");
    });

    it("omits the description when the text has none", () => {
        toasts.show({
            kind: "tookOver",
            stepTitle: "Draft check",
            personName: null,
            reviewsUrl: null
        });

        const input: INotificationInput = notifications.success.mock.calls[0][0];
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
        const warning: INotificationInput = notifications.warning.mock.calls[0][0];
        expect(warning).toEqual({
            title: "The content was not updated",
            description:
                "The review was saved, but the content does not show it yet. Reload the content to see the change.",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(ReviewToasts).inSingletonScope();

        expect(container.resolve(ReviewToastsToken)).toBe(container.resolve(ReviewToastsToken));
    });
});
