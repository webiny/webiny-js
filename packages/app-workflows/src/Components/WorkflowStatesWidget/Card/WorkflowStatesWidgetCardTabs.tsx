import React, { useMemo } from "react";
import type {
    IWorkflowStatesWidgetPresenter,
    IWorkflowStatesWidgetPresenterViewModel
} from "~/Presenters/index.js";
import { Tabs } from "@webiny/admin-ui";
import { WorkflowStateList } from "../List/WorkflowStateList.js";
import { WorkflowStateListSkeleton } from "../List/WorkflowStateListSkeleton.js";
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

const getActiveTab = (vm: IWorkflowStatesWidgetPresenterViewModel): string | undefined => {
    for (const tab of vm.states) {
        const value = vm.values[tab];
        if (value?.total && value.total > 0) {
            return tab;
        }
    }
    const keys = Object.keys(vm.values);
    return keys[0] || undefined;
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

        // `loading` flips to `false` as soon as the queries resolve, but `vm.values` is
        // populated a tick later. Until we have a resolved active tab, render the loading state
        // so the uncontrolled `Tabs` doesn't mount with an `undefined` default (which leaves all
        // tabs inactive and their content hidden until the user clicks one). While loading we
        // still render the full `Tabs` (with `loading` triggers and skeleton content) so the
        // layout doesn't jump once the data resolves and the skeletons turn into real text/rows.
        if (presenter.vm.loading || !activeTab) {
            const loadingTabs = presenter.vm.states.map(tab => (
                <Tabs.Tab
                    key={tab}
                    value={tab}
                    trigger={names[tab] || ""}
                    content={<WorkflowStateListSkeleton />}
                />
            ));

            return (
                <Tabs
                    spacing={"lg"}
                    separator={true}
                    loading={true}
                    defaultValue={presenter.vm.states[0]}
                    tabs={loadingTabs}
                />
            );
        }

        return (
            <Tabs
                spacing={"lg"}
                separator={true}
                defaultValue={activeTab}
                tabs={[...tabComponents]}
            />
        );
    }
);
