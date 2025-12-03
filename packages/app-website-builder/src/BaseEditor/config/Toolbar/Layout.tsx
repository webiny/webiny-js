import React from "react";
import { Toolbar } from "./Toolbar.js";
import { Tabs } from "@webiny/admin-ui/Tabs/index.js";

export const Layout = () => {
    return (
        <div
            data-role={"toolbar-layout"}
            className={"bg-neutral-base border-r-sm border-r-neutral-dimmed w-[300px] h-full"}
        >
            <Tabs
                size="md"
                spacing={"md"}
                defaultValue={"insert"}
                tabs={[<Toolbar.Elements key="tabs" group={"tabs"} />]}
                separator={true}
            />
        </div>
    );
};
