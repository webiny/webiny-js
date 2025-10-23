import React, { Fragment } from "react";
import { Grid } from "@webiny/admin-ui";
import type { IWorkflowState } from "~/types.js";
import { WorkflowStateTooltipContentComment } from "./WorkflowStateTooltipContentComment.js";

interface IWorkflowStateTooltipButtonProps {
    state: IWorkflowState;
}

export const WorkflowStateTooltipContent = (props: IWorkflowStateTooltipButtonProps) => {
    const { state } = props;
    return (
        <Grid className={"wby-w-[260px]"}>
            {state.steps.map(step => {
                return (
                    <Fragment key={`step-${step.id}`}>
                        <Grid.Column span={5}>{step.title}</Grid.Column>
                        <Grid.Column span={4}>{step.state}</Grid.Column>
                        <Grid.Column span={3}>
                            <WorkflowStateTooltipContentComment step={step} />
                        </Grid.Column>
                    </Fragment>
                );
            })}
        </Grid>
    );
};
