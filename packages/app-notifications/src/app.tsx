import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { NotificationsApiFeature } from "~/features/api/feature.js";
import { NotificationsPresenterFeature } from "~/presentation/notifications/feature.js";
import { NotificationsHeaderDecorator } from "~/presentation/notifications/components/NotificationsHeaderDecorator.js";

/**
 * Mount once in the admin app. Registers the notifications data-access + presenter features and
 * injects the notifications bell + inbox panel into the admin top bar (via the user-menu decorator).
 */
export const NotificationsAdminApp = () => {
    return (
        <>
            <RegisterFeature feature={NotificationsApiFeature} />
            <RegisterFeature feature={NotificationsPresenterFeature} />
            <NotificationsHeaderDecorator />
        </>
    );
};
