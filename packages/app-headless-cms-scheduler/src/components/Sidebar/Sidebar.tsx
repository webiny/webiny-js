import React from "react";
import { Components, useApolloClient } from "@webiny/app-headless-cms";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { useModel } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { Scheduler as BaseScheduler } from "@webiny/app-scheduler";
import { SchedulerButton } from "./SchedulerButton.js";

export const Sidebar = Components.Sidebar.Footer.createDecorator(Original => {
    return function ScheduleSidebarFooter({ children }) {
        const client = useApolloClient();
        const { model } = useModel();
        const { canPublish, canUnpublish } = usePermissions();

        const app = `cms:${model.modelId}`;

        if (!canPublish() && !canUnpublish()) {
            return <Original>{children}</Original>;
        }

        return (
            <Original>
                <IsModelPublishable>
                    {children}
                    <BaseScheduler
                        app={app}
                        client={client}
                        render={({ showScheduler }) => {
                            return <SchedulerButton onClick={showScheduler} />;
                        }}
                    />
                </IsModelPublishable>
            </Original>
        );
    };
});
