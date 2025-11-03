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
}

interface IRenderTabProps {
    tab: WorkflowStateValue;
    vm: IWorkflowStatesWidgetPresenterViewModel;
}

const names = {
    [WorkflowStateValue.pending]: "Pending",
    [WorkflowStateValue.inReview]: "In Review",
    [WorkflowStateValue.approved]: "Approved",
    [WorkflowStateValue.rejected]: "Rejected"
};

const RenderTab = (props: IRenderTabProps) => {
    const { tab, vm } = props;
    const value = vm.values[tab];
    if (!value) {
        return null;
    }
    return (
        <Tabs.Tab
            key={tab}
            value={tab}
            trigger={`${names[tab] || `Unknown tab ${tab}`} (${value.total})`}
            content={
                <>
                    <WorkflowStateList states={value.items} />
                </>
            }
        />
    );
};

const getActiveTab = (
    vm: IWorkflowStatesWidgetPresenterViewModel,
): string | undefined => {
    for (const tab of vm.states) {
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
        const { presenter } = props;

        const tabComponents = useMemo(() => {
            return presenter.vm.states
                .map(tab => {
                    return <RenderTab key={tab} tab={tab} vm={presenter.vm} />;
                })
                .filter((tab): tab is React.JSX.Element => tab !== null);
        }, [presenter.vm]);

        const activeTab = getActiveTab(presenter.vm);

        if (presenter.vm.loading) {
            return <Loader />;
        }
        return (
            <Tabs size="sm" separator={false} defaultValue={activeTab} tabs={[...tabComponents]} />
        );
    }
);
