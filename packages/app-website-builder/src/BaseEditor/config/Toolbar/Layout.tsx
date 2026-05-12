import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { Toolbar } from "./Toolbar.js";

export const Layout = () => {
    return (
        <div
            data-role={"editor-toolbar"}
            className={"bg-neutral-base border-r-sm border-r-neutral-dimmed h-full flex flex-col"}
        >
            <Tabs
                className={"flex-1 flex flex-col min-h-0"}
                variant={"segmented"}
                segmentedVariant={"dimmed"}
                segmentedHeaderClassName={"flex-shrink-0 px-sm py-sm"}
                tabs={[<Toolbar.Elements key={"tabs"} group={"tabs"} />]}
            />
        </div>
    );
};
