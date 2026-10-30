import React from "react";
import { Tabs } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import { parseReviewListTab } from "../parseReviewListTab.js";

export interface ReviewListTabsProps {
    presenter: ReviewListPresenter.Interface;
}

// Renders the tabs the viewer may open (`vm.tabs`): Failed steps only with `reassign` (R259).
export const ReviewListTabs = createReactiveComponent(({ presenter }: ReviewListTabsProps) => {
    const tabs = presenter.vm.tabs.map(tab => {
        return <Tabs.Tab key={tab.value} value={tab.value} trigger={tab.label} content={null} />;
    });

    const onValueChange = (value: string) => {
        const tab = parseReviewListTab(value);
        if (!tab) {
            return;
        }
        void presenter.setTab(tab);
    };

    return <Tabs value={presenter.vm.tab} onValueChange={onValueChange} tabs={tabs} />;
});
