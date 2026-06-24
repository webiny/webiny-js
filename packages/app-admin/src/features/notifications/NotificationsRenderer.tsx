import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { NotificationsFeature } from "./feature.js";
import type { INotification } from "./abstractions.js";

type Toast = ReturnType<typeof useToast>;

const showNotification = (toast: Toast, notification: INotification) => {
    const params = { title: notification.title, description: notification.description };
    switch (notification.variant) {
        case "success":
            toast.showSuccessToast(params);
            break;
        case "warning":
            toast.showWarningToast(params);
            break;
        default:
            toast.showToast(params);
    }
};

/**
 * Standalone consumer of the Notifications queue. Drains queued notifications oldest-first
 * and shows each one as a toast, then removes it from the queue. Mounted once, app-wide.
 */
export const NotificationsRenderer = observer(() => {
    const { presenter } = useFeature(NotificationsFeature);
    const toast = useToast();

    const ids = presenter.vm.notifications.map(notification => notification.id).join("|");

    useEffect(() => {
        presenter.vm.notifications.forEach(notification => {
            showNotification(toast, notification);
            presenter.markShown(notification.id);
        });
        // `ids` captures queue changes; `toast`/`presenter` are stable singletons.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ids]);

    return null;
});
