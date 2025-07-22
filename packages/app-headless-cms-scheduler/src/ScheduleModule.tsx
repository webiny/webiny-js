import React from "react";
import { SidebarFooterContainer } from "@webiny/app-headless-cms/admin/views/contentEntries/Table/Sidebar";
import { ScheduleButton } from "~/components/buttons/sidebarButton/ScheduleSidebarButton.js";

export const createScheduleModule = () => {
    return SidebarFooterContainer.createDecorator(SidebarFooterContainerOriginal => {
        return function ScheduleModule({ children }) {
            return (
                <SidebarFooterContainerOriginal>
                    <ScheduleButton
                        onClick={() => {
                            console.log(1);
                        }}
                    />
                    {children}
                </SidebarFooterContainerOriginal>
            );
        };
    });
};
