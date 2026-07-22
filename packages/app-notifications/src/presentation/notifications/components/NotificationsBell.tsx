import React from "react";
import { observer } from "mobx-react-lite";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as NotificationsIcon } from "@webiny/icons/notifications.svg";
import type { NotificationsPresenter } from "../abstractions.js";
import "../styles.js";

interface Props {
    presenter: NotificationsPresenter.Interface;
}

/**
 * Notifications toggle rendered inside the admin top bar (next to the user menu). Uses the
 * design-system IconButton so it sits in the header flow — no manual positioning. The unread
 * badge is layered on a relative wrapper around the button.
 */
export const NotificationsBell = observer(({ presenter }: Props) => {
    const { unread } = presenter.vm.counts;

    return (
        <span className="wby-notif-bell-wrap">
            <IconButton
                variant="ghost"
                size="md"
                icon={<NotificationsIcon />}
                aria-label="Notifications"
                title={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
                onClick={() => presenter.togglePanel()}
            />
            {unread > 0 ? (
                <span className="wby-notif-bell__badge">{unread > 99 ? "99+" : unread}</span>
            ) : null}
        </span>
    );
});
