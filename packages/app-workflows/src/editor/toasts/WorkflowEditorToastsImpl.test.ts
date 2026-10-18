import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowEditorToasts as ToastsAbstraction } from "./WorkflowEditorToasts.js";
import { WorkflowEditorToasts } from "./WorkflowEditorToastsImpl.js";

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

describe("WorkflowEditorToasts", () => {
    let notifications: FakeNotifications;
    let toasts: ToastsAbstraction.Interface;

    beforeEach(() => {
        notifications = createFakeNotifications();
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(WorkflowEditorToasts).inSingletonScope();
        toasts = container.resolve(ToastsAbstraction);
    });

    it("shows a success toast with the D125 options and only a title", () => {
        toasts.success("Workflow saved");

        expect(notifications.success).toHaveBeenCalledTimes(1);
        expect(notifications.success).toHaveBeenCalledWith({
            title: "Workflow saved",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.error).not.toHaveBeenCalled();
        expect(notifications.notify).not.toHaveBeenCalled();
    });

    it("shows an error toast with the D125 options", () => {
        toasts.error("Could not save. Check the highlighted step.");

        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith({
            title: "Could not save. Check the highlighted step.",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.success).not.toHaveBeenCalled();
        expect(notifications.notify).not.toHaveBeenCalled();
    });

    it("shows an info toast through the default variant with the D125 options", () => {
        toasts.info("Retrying…");

        expect(notifications.notify).toHaveBeenCalledTimes(1);
        expect(notifications.notify).toHaveBeenCalledWith({
            title: "Retrying…",
            position: "bottom-right",
            duration: 8000,
            dismissible: true
        });
        expect(notifications.success).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("adds neither a description nor a link", () => {
        toasts.success("Loaded the latest version");

        const input = notifications.success.mock.calls[0][0];
        expect(input).not.toHaveProperty("description");
        expect(input).not.toHaveProperty("link");
    });

    it("is a singleton", () => {
        const container = new Container();
        container.registerInstance(Notifications, notifications);
        container.register(WorkflowEditorToasts).inSingletonScope();

        expect(container.resolve(ToastsAbstraction)).toBe(container.resolve(ToastsAbstraction));
    });
});
