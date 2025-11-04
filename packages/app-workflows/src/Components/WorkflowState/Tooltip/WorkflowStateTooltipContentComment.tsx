import React, { useCallback } from "react";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";
import { Grid, Icon, Tag } from "@webiny/admin-ui";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import type { IWorkflowStateStep } from "~/types.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateTooltipContentCommentProps {
    presenter: IWorkflowStatePresenter;
    step: IWorkflowStateStep;
}

export const WorkflowStateTooltipContentComment = observer(
    (props: IWorkflowStateTooltipContentCommentProps) => {
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
                    <Grid gap={"none"} className={"text-center"}>
                        <Grid.Column span={2}>
                            <Icon
                                size={"xs"}
                                icon={<CommentIcon />}
                                label={"Comments"}
                                color={"neutral-strong"}
                            />
                        </Grid.Column>
                        <Grid.Column span={10} className={"pl-xs"}>
                            Comments
                        </Grid.Column>
                    </Grid>
                }
                variant={"neutral-light"}
            />
        );
    }
);
