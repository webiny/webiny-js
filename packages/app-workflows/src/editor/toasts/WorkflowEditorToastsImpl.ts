import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { INotificationInput } from "@webiny/app-admin/features/notifications/abstractions.js";
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { WorkflowEditorToasts as Abstraction } from "./WorkflowEditorToasts.js";

const createInput = (title: string): INotificationInput => {
    return {
        title,
        position: REVIEW_TOAST_POSITION,
        duration: REVIEW_TOAST_DURATION,
        dismissible: true
    };
};

class WorkflowEditorToastsImpl implements Abstraction.Interface {
    constructor(private notifications: Notifications.Interface) {}

    success(title: string): void {
        const input = createInput(title);
        this.notifications.success(input);
    }

    error(title: string): void {
        const input = createInput(title);
        this.notifications.error(input);
    }

    info(title: string): void {
        const input = createInput(title);
        this.notifications.notify(input);
    }
}

export const WorkflowEditorToasts = Abstraction.createImplementation({
    implementation: WorkflowEditorToastsImpl,
    dependencies: [Notifications]
});
