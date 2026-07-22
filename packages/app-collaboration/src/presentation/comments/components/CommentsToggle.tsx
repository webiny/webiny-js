import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";
import { useCommentsPresenter } from "../useComments.js";

export const CommentsToggle = observer(() => {
    const presenter = useCommentsPresenter();
    const { vm } = presenter;
    const count = vm.unresolvedCount;

    return (
        <Button
            variant={vm.isOpen ? "secondary" : "ghost"}
            icon={<CommentIcon />}
            onClick={() => (vm.isOpen ? presenter.closePanel() : presenter.openPanel())}
            data-testid={"cms.content-form.header.comments"}
        >
            Comments
            {count > 0 ? (
                <span
                    style={{
                        marginLeft: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 18,
                        height: 18,
                        padding: "0 5px",
                        background: "var(--color-primary)",
                        color: "var(--color-neutral-light, #fff)",
                        borderRadius: 9,
                        fontSize: 11
                    }}
                >
                    {count}
                </span>
            ) : null}
        </Button>
    );
});
