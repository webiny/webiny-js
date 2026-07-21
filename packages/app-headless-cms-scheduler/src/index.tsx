import React from "react";
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
            <BrowserConfig />
            <EditorConfig />
            <ScheduledActionAlertDecorator />
            <PublishScheduleNoticeDecorator />
            <UnpublishScheduleNoticeDecorator />
        </>
    );
};
