import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { Toolbar } from "./Toolbar.js";

export const Layout = () => {
    return (
        <div
            data-role={"editor-toolbar"}
            className={"bg-neutral-base border-r-sm border-r-neutral-dimmed h-full flex flex-col"}
        >
            <SegmentedControl.Tabs
                className={"flex-1 flex flex-col min-h-0"}
                variant={"dimmed"}
                headerClassName={"flex-shrink-0 px-sm py-sm"}
            >
                <Toolbar.Elements group={"tabs"} />
            </SegmentedControl.Tabs>
        </div>
    );
};
