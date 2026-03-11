import React from "react";
import { Components, useApolloClient } from "@webiny/app-headless-cms";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { useContentEntryEditor } from "@webiny/app-headless-cms/exports/admin/cms/entry/editor.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { Scheduler as BaseScheduler } from "@webiny/app-scheduler";
import { SchedulerButton } from "~/Components/Sidebar/SchedulerButton.js";

export const Sidebar = Components.Sidebar.Footer.createDecorator(Original => {
    return function ScheduleSidebarFooter({ children }) {
        const client = useApolloClient();
        const { contentModel } = useContentEntryEditor();
        const { canPublish, canUnpublish } = usePermissions();

        const app = `cms:${contentModel.modelId}`;

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
