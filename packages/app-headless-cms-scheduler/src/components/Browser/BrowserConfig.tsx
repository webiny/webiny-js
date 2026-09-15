import React from "react";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { MenuItem } from "./MenuItem.js";
import { SchedulerMenuItem } from "./SchedulerMenuItem.js";
import { CellLive } from "./CellLive.js";

const { Browser } = ContentEntryListConfig;

export const BrowserConfig = () => {
    return (
        <ContentEntryListConfig>
            <IsModelPublishable>
                <Browser.Sidebar.Footer name={"scheduler"} element={<SchedulerMenuItem />} />
                <Browser.Entry.Action name={"schedule"} element={<MenuItem />} />
                {/* Override the core "Live" column cell to surface scheduled actions. Same column
                    name merges over the core (primary) definition from the public (secondary)
                    config, replacing only the cell. */}
                <Browser.Table.Column
                    name={"live"}
                    header={"Live"}
                    truncate={false}
                    cell={<CellLive />}
                />
            </IsModelPublishable>
        </ContentEntryListConfig>
    );
};
