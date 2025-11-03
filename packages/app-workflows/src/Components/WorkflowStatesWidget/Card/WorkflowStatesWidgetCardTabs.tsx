import React, { useMemo } from "react";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "~/Presenters/index.js";
import { Loader, Tabs } from "@webiny/admin-ui";
import { WorkflowStateList } from "../State/WorkflowStateList.js";
import { observer } from "mobx-react-lite";
import { WorkflowStateValue } from "~/types.js";

interface IWorkflowStatesWidgetCardTabsProps {
    presenter: IWorkflowStatesWidgetPresenter;
    tabs: WorkflowStateValue[];
}

interface IRenderTabProps {
    tab: WorkflowStateValue;
    vm: IWorkflowStatesWidgetPresenterViewModel;
}

const RenderTab = (props: IRenderTabProps) => {
    const { tab, vm } = props;
    switch (tab) {
        case WorkflowStateValue.pending:
            return (
                <Tabs.Tab
                    key="pending"
                    value="pending"
                    trigger={`Pending (${vm.pendingCount})`}
                    content={
                        <>
                            <WorkflowStateList states={vm.pending} />
                        </>
                    }
                />
            );
        case WorkflowStateValue.inReview:
            return (
                <Tabs.Tab
                    key="inReview"
                    value="inReview"
                    trigger={`In Review (${vm.inReviewCount})`}
                    content={
                        <>
                            <WorkflowStateList states={vm.inReview} />
                        </>
                    }
                />
            );
        case WorkflowStateValue.approved:
            return (
                <Tabs.Tab
                    key="approved"
                    value="approved"
                    trigger={`Approved (${vm.approvedCount})`}
                    content={
                        <>
                            <WorkflowStateList states={vm.approved} />
                        </>
                    }
                />
            );
        case WorkflowStateValue.rejected:
            return (
                <Tabs.Tab
                    key="rejected"
                    value="rejected"
                    trigger={`Rejected (${vm.rejectedCount})`}
                    content={
                        <>
                            <WorkflowStateList states={vm.rejected} />
                        </>
                    }
                />
            );
    }
};

const getActiveTab = (
    vm: IWorkflowStatesWidgetPresenterViewModel,
    tabs: WorkflowStateValue[]
): string | undefined => {
    for (const tab of tabs) {
        const key = `${tab}Count` as keyof IWorkflowStatesWidgetPresenterViewModel;
        const value = vm[key];
        if (typeof value === "number" && value > 0) {
            return tab;
        }
    }
    return undefined;
};

export const WorkflowStatesWidgetCardTabs = observer(
    (props: IWorkflowStatesWidgetCardTabsProps) => {
        const { presenter, tabs } = props;

        const tabComponents = useMemo(() => {
            return tabs
                .map(tab => {
                    return <RenderTab key={tab} tab={tab} vm={presenter.vm} />;
                })
                .filter((tab): tab is React.JSX.Element => tab !== null);
        }, [tabs, presenter.vm]);

        const activeTab = getActiveTab(presenter.vm, tabs);

        if (presenter.vm.loading) {
            return <Loader />;
        }
        return (
            <Tabs size="sm" separator={false} defaultValue={activeTab} tabs={[...tabComponents]} />
        );
    }
);
