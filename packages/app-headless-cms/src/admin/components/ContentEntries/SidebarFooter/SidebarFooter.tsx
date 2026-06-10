import React from "react";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/list/ContentEntryListConfig.js";

export const SidebarFooter = () => {
    const { browser } = useContentEntryListConfig();

    return (
        <div className={"px-xs py-sm bg-neutral-base"}>
            {browser.sidebarFooter.map(footer => {
                return React.cloneElement(footer.element, { key: footer.name });
            })}
        </div>
    );
};
