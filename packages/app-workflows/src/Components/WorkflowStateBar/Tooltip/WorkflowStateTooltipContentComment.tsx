import React from "react";
import type { IWorkflowStateStep } from "~/types.js";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";

interface IWorkflowStateTooltipContentCommentProps {
    step: IWorkflowStateStep;
}

export const WorkflowStateTooltipContentComment = ({
    step
}: IWorkflowStateTooltipContentCommentProps) => {
    if (!step.comment) {
        return null;
    }
    return (
        <>
            <CommentIcon /> Comment
        </>
    );
};
