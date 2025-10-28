import React from "react";
import { Card, Icon } from "@webiny/admin-ui";
import { ReactComponent as ReviewRequestsIcon } from "@webiny/icons/reviews.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { observer } from "mobx-react-lite";
import { useWorkflowStatesWidget } from "../Provider/useWorkflowStatesWidget.js";
import { WorkflowStatesWidgetCardTabs } from "./WorkflowStatesWidgetCardTabs.js";

interface IWorkflowStateWidgetCardProps {
    title: React.ReactNode;
}

export const WorkflowStateWidgetCard = observer(({ title }: IWorkflowStateWidgetCardProps) => {
    const { presenter } = useWorkflowStatesWidget();
    return (
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
            options={
                <>
                    <Icon icon={<AddIcon />} label={"View All"} color={"neutral-strong"} />
                    View All
                </>
            }
            padding="standard"
            elevation="md"
            borderRadius="md"
        >
            <WorkflowStatesWidgetCardTabs presenter={presenter} />
        </Card>
    );
});
