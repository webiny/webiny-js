import React, { useMemo } from "react";
import type { IWorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
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
    presenter: IWorkflowStatesWidgetPresenter;
}

const RenderTab = (props: IRenderTabProps) => {
    const { tab, presenter } = props;
    switch (tab) {
        case WorkflowStateValue.pending:
            return (
                <Tabs.Tab
                    key="pending"
                    value="pending"
                    trigger={`Pending (${presenter.vm.pendingCount})`}
                    content={
                        <>
                            <WorkflowStateList states={presenter.vm.pending} />
                        </>
                    }
                />
            );
        case WorkflowStateValue.inReview:
            return (
                <Tabs.Tab
                    key="inReview"
                    value="inReview"
                    trigger={`In Review (${presenter.vm.inReviewCount})`}
                    content={
                        <>
                            <WorkflowStateList states={presenter.vm.inReview} />
                        </>
                    }
                />
            );
        case WorkflowStateValue.approved:
            return (
                <Tabs.Tab
                    key="approved"
                    value="approved"
                    trigger={`Approved (${presenter.vm.approvedCount})`}
                    content={
                        <>
                            <WorkflowStateList states={presenter.vm.approved} />
                        </>
                    }
                />
            );
        case WorkflowStateValue.rejected:
            return (
                <Tabs.Tab
                    key="rejected"
                    value="rejected"
                    trigger={`Rejected (${presenter.vm.rejectedCount})`}
                    content={
                        <>
                            <WorkflowStateList states={presenter.vm.rejected} />
                        </>
                    }
                />
            );
    }
};

export const WorkflowStatesWidgetCardTabs = observer(
    (props: IWorkflowStatesWidgetCardTabsProps) => {
        const { presenter, tabs } = props;

        const tabComponents = useMemo(() => {
            return tabs.map(tab => {
                return <RenderTab key={`tab.${tab}`} tab={tab} presenter={presenter} />;
            });
        }, [tabs, presenter.vm]);

        if (presenter.vm.loading) {
            return <Loader />;
        }
        return <Tabs size="sm" separator={false} tabs={tabComponents} />;
    }
);
