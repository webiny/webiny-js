import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as CommentIcon } from "@webiny/icons/comment.svg";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCommentsPresenter } from "../useComments.js";

export const CommentsToggle = observer(() => {
    const presenter = useCommentsPresenter();
    const { vm: formVm } = useContentEntryFormPresenter();
    const { vm } = presenter;

    // Comments anchor to a persisted entry, so there's nothing to open until the entry is saved
    // (a new/unsaved entry has no id). Hide the toggle until then.
    if (formVm.isNewEntry || !formVm.entry) {
        return null;
    }

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
