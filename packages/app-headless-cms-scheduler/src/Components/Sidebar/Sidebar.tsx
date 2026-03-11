import React from "react";
import { Components } from "@webiny/app-headless-cms";

export const Sidebar = Components.Sidebar.Footer.createDecorator(Original => {
    return function ScheduleSidebarFooter(props) {
        return (
            <Original>
                <IsModelPublishable>
                    <Scheduler />
                </IsModelPublishable>
            </Original>
        );
    };
});
