import React from "react";
import type { IWorkflowStatesWidgetPresenter } from "~/Presenters/index.js";
import { Loader, Tabs } from "@webiny/admin-ui";
import { WorkflowStateList } from "../State/WorkflowStateList.js";
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
                        trigger={`In Review (${presenter.vm.inReviewTotalCount})`}
                        content={
                            <>
                                <WorkflowStateList states={presenter.vm.inReview} />
                            </>
                        }
                    />,
                    <Tabs.Tab
                        key="approved"
                        value="approved"
                        trigger={`Approved (${presenter.vm.approvedTotalCount})`}
                        content={
                            <>
                                <WorkflowStateList states={presenter.vm.approved} />
                            </>
                        }
                    />,
                    <Tabs.Tab
                        key="declined"
                        value="declined"
                        trigger={`Declined (${presenter.vm.rejectedTotalCount})`}
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
