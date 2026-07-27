import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as AddCommentIcon } from "@webiny/icons/add_comment.svg";
import { ReactComponent as ChatBubbleIcon } from "@webiny/icons/chat_bubble.svg";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { useCommentsPresenter } from "~/presentation/comments/useComments.js";
import "~/presentation/comments/styles.js";

interface CommentFieldMarkerProps {
    field: IFieldVM;
}

/**
 * Per-field affordance in the CMS entry form: a comment-count badge when the field has open
 * threads, otherwise a hover-revealed "Comment" pill. Clicking opens the panel focused on this
 * field. Renders nothing outside the entry editor (no contentId loaded).
 */
export const CommentFieldMarker = observer(({ field }: CommentFieldMarkerProps) => {
    const presenter = useCommentsPresenter();
    const { vm } = presenter;

    if (!vm.contentId) {
        return null;
    }

    const locator = field.qualifiedName;
    const count = vm.threads.filter(thread => thread.locator === locator).length;

    if (count > 0) {
        return (
            <span
                className="wby-collab-marker wby-collab-marker--count"
                title={`Show ${count} comment${count === 1 ? "" : "s"} on this field`}
                onClick={() => presenter.openForField(locator)}
            >
                <ChatBubbleIcon />
                <span className="wby-collab-marker__badge">{count}</span>
            </span>
        );
    }

    return (
        <span
            className="wby-collab-marker wby-collab-marker--add"
            title="Add comment"
            onClick={() => presenter.openPanel(locator)}
        >
            <AddCommentIcon />
            Comment
        </span>
    );
});
