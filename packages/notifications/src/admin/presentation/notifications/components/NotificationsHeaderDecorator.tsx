import React, { useEffect } from "react";
import { createReactiveComponent, UserMenu } from "@webiny/app-admin";
import { useNotificationsPresenter } from "~/admin/presentation/notifications/useNotifications.js";
import { NotificationsBell } from "~/admin/presentation/notifications/components/NotificationsBell.js";
import { NotificationsPanel } from "~/admin/presentation/notifications/components/NotificationsPanel.js";

/**
 * Registers the notifications bell into the admin top bar by decorating the user menu: the bell
 * renders immediately before it, in the header's flex row, so placement is handled by the layout
 * (no fixed positioning). The slide-in panel mounts here too (fixed overlay, toggled via the
 * shared presenter).
 */
export const NotificationsHeaderDecorator = UserMenu.createDecorator(Original => {
    return createReactiveComponent(function UserMenuWithNotifications() {
        const presenter = useNotificationsPresenter();

        useEffect(() => {
            void presenter.init();
        }, [presenter]);

        return (
            <>
                <NotificationsBell presenter={presenter} />
                {/* Always mounted — the Drawer inside handles its own open/close animation. */}
                <NotificationsPanel presenter={presenter} />
                <Original />
            </>
        );
    });
});
