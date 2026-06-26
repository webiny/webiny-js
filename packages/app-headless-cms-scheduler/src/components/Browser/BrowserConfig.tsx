import React from "react";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { MenuItem } from "./MenuItem.js";
import { SchedulerMenuItem } from "./SchedulerMenuItem.js";

const { Browser } = ContentEntryListConfig;

export const BrowserConfig = () => {
    return (
        <ContentEntryListConfig>
            <IsModelPublishable>
                <Browser.Sidebar.Footer name={"scheduler"} element={<SchedulerMenuItem />} />
                <Browser.Entry.Action name={"schedule"} element={<MenuItem />} />
            </IsModelPublishable>
        </ContentEntryListConfig>
    );
};
