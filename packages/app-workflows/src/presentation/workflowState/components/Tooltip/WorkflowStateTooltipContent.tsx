import React, { Fragment, useCallback } from "react";
import { Grid, Tag } from "@webiny/admin-ui";
import { WorkflowStateTooltipContentComment } from "./WorkflowStateTooltipContentComment.js";
import type { IWorkflowStatePresenter } from "~/presentation/workflowState/abstractions.js";
import { TagState } from "~/presentation/shared/TagState.js";
import type { IWorkflowState, IWorkflowStateStep } from "~/types.js";

interface IWorkflowStateTooltipButtonProps {
    presenter: IWorkflowStatePresenter;
    state: IWorkflowState;
}

export const WorkflowStateTooltipContent = (props: IWorkflowStateTooltipButtonProps) => {
    const { state, presenter } = props;

    const createShowComment = useCallback((step: Pick<IWorkflowStateStep, "id">) => {
        return () => {
            presenter.showCommentDialog(step.id);
        };
    }, []);
    return (
        <Grid className={"w-[350px] text-sm"} gap={"small"}>
            <>
                <Grid.Column span={12}>
                    <strong>Workflow progress</strong>
                </Grid.Column>
                {state.steps.map(step => {
                    return (
                        <Fragment key={`step-${step.id}`}>
                            <Grid.Column span={4}>
                                <Tag
                                    swatchColor={step.color}
                                    content={step.title}
                                    variant={"neutral-light"}
                                />
                            </Grid.Column>
                            <Grid.Column span={4}>
                                <TagState state={step.state} />
                            </Grid.Column>
                            <Grid.Column span={4}>
                                <WorkflowStateTooltipContentComment
                                    showComment={createShowComment(step)}
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
