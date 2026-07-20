import React from "react";
import { EditorConfig, BrowserConfig, ScheduledActionAlertDecorator } from "./components/index.js";

export const CmsScheduler = () => {
    return (
        <>
            <BrowserConfig />
            <EditorConfig />
            <ScheduledActionAlertDecorator />
        </>
    );
};
