import React from "react";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { SimpleLink } from "@webiny/app";
import { useFeature } from "@webiny/app";
import { Icon } from "@webiny/admin-ui";
import { useToast } from "@webiny/admin-ui";
import type { ShowToastParams } from "@webiny/admin-ui";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { NotificationsFeature } from "./feature.js";
import type { INotification } from "./abstractions.js";

type Toast = ReturnType<typeof useToast>;

const getToastParams = (notification: INotification): ShowToastParams => {
    const params: ShowToastParams = {
        title: notification.title,
        description: notification.description
    };

    if (notification.duration !== undefined) {
        params.duration = notification.duration;
    }

    if (notification.position !== undefined) {
        params.position = notification.position;
    }

    if (notification.dismissible !== undefined) {
        params.dismissible = notification.dismissible;
    }

    if (notification.link) {
        params.actions = (
            <SimpleLink to={notification.link.url}>{notification.link.label}</SimpleLink>
        );
    }

    return params;
};

const showNotification = (toast: Toast, notification: INotification) => {
    const params = getToastParams(notification);

    switch (notification.variant) {
        case "success":
            toast.showSuccessToast(params);
            break;
        case "warning":
            toast.showWarningToast(params);
            break;
        case "error":
            params.icon = <Icon icon={<ErrorIcon />} label={""} className={"fill-destructive"} />;
            toast.showToast(params);
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
