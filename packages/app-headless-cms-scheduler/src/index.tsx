import React from "react";
import { EditorConfig, BrowserConfig, Sidebar } from "./components/index.js";

export const CmsScheduler = () => {
    return (
        <>
            <Sidebar />
            <BrowserConfig />
            <EditorConfig />
        </>
    );
};
