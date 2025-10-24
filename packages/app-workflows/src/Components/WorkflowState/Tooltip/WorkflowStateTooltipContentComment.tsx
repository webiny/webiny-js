import React, { useCallback } from "react";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";
import { Grid, Tag } from "@webiny/admin-ui";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import type { IWorkflowStateStep } from "~/types.js";

interface IWorkflowStateTooltipContentCommentProps {
    presenter: IWorkflowStatePresenter;
    step: IWorkflowStateStep;
}

export const WorkflowStateTooltipContentComment = (
    props: IWorkflowStateTooltipContentCommentProps
) => {
    const { step, presenter } = props;

    const showComment = useCallback(() => {
        presenter.showCommentDialog(step.id);
    }, [step.id]);

    if (!step.comment) {
        return null;
    }
    return (
        <Tag
            onClick={showComment}
            content={
                <Grid gap={"none"}>
                    <Grid.Column span={2}>
                        <CommentIcon
                            width={12}
                            height={"auto"}
                            className={"wby-fill-neutral-strong"}
                        />
                    </Grid.Column>
                    <Grid.Column span={10} className={"wby-pl-xs"}>
                        Comments
                    </Grid.Column>
                </Grid>
            }
            variant={"neutral-light"}
        />
    );
};
