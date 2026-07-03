import React from "react";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";
import { Icon, Tag } from "@webiny/admin-ui";
import type { IWorkflowStateStep } from "~/types.js";
import { observer } from "mobx-react-lite";

interface IWorkflowStateTooltipContentCommentProps {
    showComment: () => void;
    step: IWorkflowStateStep;
}

export const WorkflowStateTooltipContentComment = observer(
    (props: IWorkflowStateTooltipContentCommentProps) => {
        const { step, showComment } = props;
        if (!step.comment) {
            return null;
        }
        return (
            <Tag
                onClick={showComment}
                icon={
                    <Icon
                        size={"xs"}
                        icon={<CommentIcon />}
                        label={"Comments"}
                        color={"neutral-strong"}
                    />
                }
                content={<>Comments</>}
                variant={"neutral-light"}
            />
        );
    }
);
