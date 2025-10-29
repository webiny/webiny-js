import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { Tabs } from "@webiny/admin-ui";
import { Sidebar } from "./Sidebar.js";

export const Layout = makeDecoratable("SidebarLayout", () => {
    return (
        <div className={"bg-neutral-base border-l-sm border-l-neutral-dimmed"}>
            <Tabs
                size="md"
                spacing={"md"}
                separator={true}
                defaultValue={"element"}
                tabs={[<Sidebar.Elements group="groups" key={"groups"} />]}
            />
        </div>
    );
});
