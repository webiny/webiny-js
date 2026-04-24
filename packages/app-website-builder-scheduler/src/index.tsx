import React from "react";
import {
    PageEditorScheduleConfig,
    PagesConfig,
    PagesSidebarConfig,
    RedirectsConfig
} from "./components/index.js";

export const WbScheduler = () => {
    return (
        <>
            <PageEditorScheduleConfig />
            <PagesConfig />
            <PagesSidebarConfig />
            <RedirectsConfig />
        </>
    );
};
