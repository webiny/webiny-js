import React from "react";
import { usePageListConfig } from "~/modules/pages/configs";

export const SidebarFooter = () => {
    const { browser } = usePageListConfig();

    return (
        <>
            {browser.sidebarFooter.map(footer => {
                return React.cloneElement(footer.element, { key: footer.name });
            })}
        </>
    );
};
