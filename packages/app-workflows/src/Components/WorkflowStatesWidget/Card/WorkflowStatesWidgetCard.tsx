import React from "react";
import { Card, Icon } from "@webiny/admin-ui";
import { ReactComponent as ReviewRequestsIcon } from "@webiny/icons/reviews.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { observer } from "mobx-react-lite";
import { useWorkflowStatesWidget } from "../Provider/useWorkflowStatesWidget.js";
import { WorkflowStatesWidgetCardTabs } from "./WorkflowStatesWidgetCardTabs.js";
import {
    ApproveDialog,
    ApproveSuccessDialog,
    RejectDialog,
    RejectSuccessDialog
} from "../Dialogs/index.js";

interface IWorkflowStateWidgetCardProps {
    title: React.ReactNode;
}

export const WorkflowStateWidgetCard = observer(({ title }: IWorkflowStateWidgetCardProps) => {
    const { presenter } = useWorkflowStatesWidget();

    return (
        <>
            {presenter.vm.showApproveDialog ? (
                <ApproveDialog state={presenter.vm.showApproveDialog} />
            ) : null}
            {presenter.vm.showApproveSuccessDialog ? (
                <ApproveSuccessDialog state={presenter.vm.showApproveSuccessDialog} />
            ) : null}
            {presenter.vm.showDeclineDialog ? (
                <RejectDialog state={presenter.vm.showDeclineDialog} />
            ) : null}
            {presenter.vm.showDeclineSuccessDialog ? (
                <RejectSuccessDialog state={presenter.vm.showDeclineSuccessDialog} />
            ) : null}
            <Card
                title={
                    <>
                        <Icon
                            icon={<ReviewRequestsIcon />}
                            color={"accent"}
                            label={"Review Requests"}
                        />
                        {title}
                    </>
                }
                actions={
                    <>
                        <Icon icon={<AddIcon />} label={"View All"} color={"neutral-strong"} />
                        View All
                    </>
                }
                padding="sm"
                elevation="small"
            >
                <WorkflowStatesWidgetCardTabs presenter={presenter} />
            </Card>
        </>
    );
});
