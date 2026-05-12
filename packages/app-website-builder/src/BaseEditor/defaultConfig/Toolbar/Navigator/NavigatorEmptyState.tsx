import React from "react";
import { Text, Button } from "@webiny/admin-ui";
import { useToolbarTabs } from "~/BaseEditor/config/Toolbar/ToolbarTabsContext.js";
import { LayoutIllustration } from "./LayoutIllustration.js";

export const NavigatorEmptyState = () => {
    const { setActiveTab } = useToolbarTabs();

    return (
        <div className={"flex flex-col items-center gap-md px-md text-center mt-[200px]"}>
            <LayoutIllustration />
            <Text size={"sm"} className={"text-neutral-strong"}>
                {"You do not have any items in your layout. Add your first item in Insert panel."}
            </Text>
            <Button
                variant={"secondary"}
                text={"Add item"}
                size={"sm"}
                onClick={() => setActiveTab("insert")}
            />
        </div>
    );
};
