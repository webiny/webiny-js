import React, { Fragment } from "react";
import { Grid, Heading, Tag } from "@webiny/admin-ui";
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
        <Grid className={"wby-w-[260px]"}>
            <>
                <Grid.Column span={12}>
                    <Heading level={6}>Workflow progress</Heading>
                </Grid.Column>
                {state.steps.map(step => {
                    return (
                        <Fragment key={`step-${step.id}`}>
                            <Grid.Column span={5}>
                                <Tag content={step.title} variant={"neutral-light"} />
                            </Grid.Column>
                            <Grid.Column span={4}>
                                <Tag content={step.state} color={step.color} />
                            </Grid.Column>
                            <Grid.Column span={3}>
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
