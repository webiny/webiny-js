import React, { Fragment } from "react";
import { Grid, Tag } from "@webiny/admin-ui";
import { WorkflowStateTooltipContentComment } from "./WorkflowStateTooltipContentComment.js";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import { IWorkflowState } from "~/types.js";

interface IWorkflowStateTooltipButtonProps {
    presenter: IWorkflowStatePresenter;
    state: IWorkflowState;
}

export const WorkflowStateTooltipContent = (props: IWorkflowStateTooltipButtonProps) => {
    const { state, presenter } = props;
    return (
        <Grid className={"wby-w-[350px] wby-text-sm"} gap={"small"}>
            <>
                <Grid.Column span={12}>
                    <strong>Workflow progress</strong>
                </Grid.Column>
                {state.steps.map(step => {
                    return (
                        <Fragment key={`step-${step.id}`}>
                            <Grid.Column span={4}>
                                <Tag content={step.title} variant={"neutral-light"} />
                            </Grid.Column>
                            <Grid.Column span={4}>
                                <Tag content={step.state} color={step.color} />
                            </Grid.Column>
                            <Grid.Column span={4}>
                                <WorkflowStateTooltipContentComment
                                    presenter={presenter}
                                    step={step}
                                />
                            </Grid.Column>
                        </Fragment>
                    );
                })}
            </>
        </Grid>
    );
};
