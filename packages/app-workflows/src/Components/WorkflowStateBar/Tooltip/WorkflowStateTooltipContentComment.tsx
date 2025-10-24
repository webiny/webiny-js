import React from "react";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";
import { Tag } from "@webiny/admin-ui";
import type { IWorkflowStatePresenter } from "~/Presenters/index.js";
import type { IWorkflowStateStep } from "~/types.js";

interface IWorkflowStateTooltipContentCommentProps {
    presenter: IWorkflowStatePresenter;
    step: IWorkflowStateStep;
}

export const WorkflowStateTooltipContentComment = ({
    step
}: IWorkflowStateTooltipContentCommentProps) => {
    if (!step.comment) {
        return null;
    }
    return (
        <Tag
            content={
                <>
                    <CommentIcon /> Comment
                </>
            }
            variant={"neutral-light"}
            isDismissible={false}
        />
    );
};
