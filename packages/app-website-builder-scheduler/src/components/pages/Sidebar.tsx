import React from "react";
import { Scheduler as BaseScheduler } from "@webiny/app-scheduler";
import { PageListConfig } from "@webiny/app-website-builder/exports/admin/website-builder/page/list.js";
import { usePermissions } from "~/hooks/usePermissions.js";
import { SchedulerButton } from "./SchedulerButton.js";
import { WB_PAGE_NAMESPACE } from "~/utils/namespace.js";

const { Browser } = PageListConfig;

const SchedulerFooterElement = () => {
    const { canPublishPage, canUnpublishPage } = usePermissions();

    if (!canPublishPage && !canUnpublishPage) {
        return null;
    }

    return (
        <BaseScheduler
            namespace={WB_PAGE_NAMESPACE}
            canPublish={canPublishPage}
            canUnpublish={canUnpublishPage}
            render={({ showScheduler }) => {
                return <SchedulerButton onClick={showScheduler} />;
            }}
        />
    );
};

export const PagesSidebarConfig = () => {
    return (
        <PageListConfig>
            <Browser.Sidebar.Footer name={"page-schedule"} element={<SchedulerFooterElement />} />
        </PageListConfig>
    );
};
