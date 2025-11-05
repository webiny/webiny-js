import React from "react";
import { Button, Card, Icon } from "@webiny/admin-ui";
import { ReactComponent as ReviewRequestsIcon } from "@webiny/icons/reviews.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { observer } from "mobx-react-lite";
import { useWorkflowStatesWidget } from "../Provider/useWorkflowStatesWidget.js";
import { WorkflowStatesWidgetCardTabs } from "./WorkflowStatesWidgetCardTabs.js";
import {
    ApproveDialog,
    ApproveSuccessDialog,
    RejectDialog,
    RejectSuccessDialog,
    StartDialog,
    StartSuccessDialog,
    TakeOverDialog,
    TakeOverSuccessDialog
} from "../Dialogs/index.js";

interface IWorkflowStateWidgetCardProps {
    title: React.ReactNode;
}

export const WorkflowStateWidgetCard = observer(({ title }: IWorkflowStateWidgetCardProps) => {
    const { presenter } = useWorkflowStatesWidget();

    return (
        <>
            {presenter.vm.showStartDialog ? (
                <StartDialog state={presenter.vm.showStartDialog} />
            ) : null}
            {presenter.vm.showStartSuccessDialog ? (
                <StartSuccessDialog state={presenter.vm.showStartSuccessDialog} />
            ) : null}
            {presenter.vm.showTakeOverDialog ? (
                <TakeOverDialog state={presenter.vm.showTakeOverDialog} />
            ) : null}
            {presenter.vm.showTakeOverSuccessDialog ? (
                <TakeOverSuccessDialog state={presenter.vm.showTakeOverSuccessDialog} />
            ) : null}
            {presenter.vm.showApproveDialog ? (
                <ApproveDialog state={presenter.vm.showApproveDialog} />
            ) : null}
            {presenter.vm.showApproveSuccessDialog ? (
                <ApproveSuccessDialog state={presenter.vm.showApproveSuccessDialog} />
            ) : null}
            {presenter.vm.showRejectDialog ? (
                <RejectDialog state={presenter.vm.showRejectDialog} />
            ) : null}
            {presenter.vm.showRejectSuccessDialog ? (
                <RejectSuccessDialog state={presenter.vm.showRejectSuccessDialog} />
            ) : null}
            <Card
                icon={
                    <Card.Icon
                        icon={<ReviewRequestsIcon />}
                        label={"Review Requests"}
                        color={"accent"}
                    />
                }
                title={title}
                actions={
                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        icon={<Icon icon={<AddIcon />} label={"View All"} />}
                    >
                        View All
                    </Button>
                }
                actionsPosition={"header"}
                bodyPadding={false}
                elevation="small"
            >
                <WorkflowStatesWidgetCardTabs presenter={presenter} />
            </Card>
        </>
    );
});
