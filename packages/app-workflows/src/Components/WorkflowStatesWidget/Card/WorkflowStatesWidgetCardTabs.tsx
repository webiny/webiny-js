import React from "react";
import type { IWorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
import { Loader, Tabs } from "@webiny/admin-ui";
import { WorkflowStateList } from "~/Components/WorkflowStatesWidget/State/WorkflowStateList.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStatesWidgetCardTabsProps {
    presenter: IWorkflowStatesWidgetPresenter;
}

export const WorkflowStatesWidgetCardTabs = observer(
    (props: IWorkflowStatesWidgetCardTabsProps) => {
        const { presenter } = props;

        if (presenter.vm.loading) {
            return <Loader />;
        }
        return (
            <Tabs
                size="sm"
                separator={false}
                tabs={[
                    <Tabs.Tab
                        key="inReview"
                        value="inReview"
                        trigger="In Review"
                        content={
                            <>
                                <WorkflowStateList states={presenter.vm.inReview} />
                            </>
                        }
                    />,
                    <Tabs.Tab
                        key="approved"
                        value="approved"
                        trigger="Approved"
                        content={
                            <>
                                <WorkflowStateList states={presenter.vm.approved} />
                            </>
                        }
                    />,
                    <Tabs.Tab
                        key="declined"
                        value="declined"
                        trigger="Declined"
                        content={
                            <>
                                <WorkflowStateList states={presenter.vm.rejected} />
                            </>
                        }
                    />
                ]}
            />
        );
    }
);
