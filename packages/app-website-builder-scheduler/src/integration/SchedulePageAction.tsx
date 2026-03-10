import React from "react";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/calendar_month.svg";
import { PageListConfig } from "@webiny/app-website-builder";
import { usePage } from "@webiny/app-website-builder/modules/pages/PagesList/hooks/usePage.js";
import { WbScheduler } from "~/Presentation/index.js";

const { OptionsMenuItem } = PageListConfig.Browser.Page.Action;

export const SchedulePageAction = () => {
    const { page } = usePage();

    return (
        <WbScheduler
            targetId={page.id}
            render={({ showScheduler }) => (
                <OptionsMenuItem
                    icon={<ScheduleIcon />}
                    label={"Manage schedule"}
                    onAction={showScheduler}
                />
            )}
        />
    );
};
