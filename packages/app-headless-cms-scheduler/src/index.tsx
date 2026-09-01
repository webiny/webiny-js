import React from "react";
import { RegisterFeature } from "@webiny/app-admin";
import { ScheduledActionsPresenterFeature } from "./presentation/scheduledActions/feature.js";
import {
    EditorConfig,
    BrowserConfig,
    ScheduledActionAlertDecorator,
    PublishScheduleNoticeDecorator,
    UnpublishScheduleNoticeDecorator
} from "./components/index.js";

export const CmsScheduler = () => {
    return (
        <>
            <RegisterFeature feature={ScheduledActionsPresenterFeature} />
            <BrowserConfig />
            <EditorConfig />
            <ScheduledActionAlertDecorator />
            <PublishScheduleNoticeDecorator />
            <UnpublishScheduleNoticeDecorator />
        </>
    );
};
