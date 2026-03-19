import React from "react";
import { PagesConfig, PagesSidebarConfig, RedirectsConfig } from "./components/index.js";

export const WbScheduler = () => {
    return (
        <>
            <PagesConfig />
            <PagesSidebarConfig />
            <RedirectsConfig />
        </>
    );
};
