import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { NotificationsApiFeature } from "./features/api/feature.js";
import { NotificationsPresenterFeature } from "./presentation/notifications/feature.js";
import { NotificationsHeaderDecorator } from "./presentation/notifications/components/NotificationsHeaderDecorator.js";

export const Extension = () => {
    return (
        <>
            <RegisterFeature feature={NotificationsApiFeature} />
            <RegisterFeature feature={NotificationsPresenterFeature} />
            <NotificationsHeaderDecorator />
        </>
    );
};
