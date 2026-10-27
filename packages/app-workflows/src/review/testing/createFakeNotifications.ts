import { vi } from "vitest";
import type { Mock } from "vitest";
import type { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";

// The admin notification queue as a fake: every method a vitest mock, so tests read its calls.
export interface FakeNotifications extends Notifications.Interface {
    notify: Mock<Notifications.Interface["notify"]>;
    success: Mock<Notifications.Interface["success"]>;
    warning: Mock<Notifications.Interface["warning"]>;
    error: Mock<Notifications.Interface["error"]>;
    getNotifications: Mock<Notifications.Interface["getNotifications"]>;
    remove: Mock<Notifications.Interface["remove"]>;
}

export const createFakeNotifications = (): FakeNotifications => {
    return {
        notify: vi.fn<Notifications.Interface["notify"]>(),
        success: vi.fn<Notifications.Interface["success"]>(),
        warning: vi.fn<Notifications.Interface["warning"]>(),
        error: vi.fn<Notifications.Interface["error"]>(),
        getNotifications: vi.fn<Notifications.Interface["getNotifications"]>().mockReturnValue([]),
        remove: vi.fn<Notifications.Interface["remove"]>()
    };
};
