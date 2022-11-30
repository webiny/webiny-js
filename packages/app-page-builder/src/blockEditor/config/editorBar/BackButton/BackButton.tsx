import React, { useCallback, useState } from "react";
import { css } from "emotion";
import { Prompt } from "@webiny/react-router";
import { createComponentPlugin } from "@webiny/app-admin";
import { useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import { useBlock } from "~/blockEditor/hooks/useBlock";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const navigate = useNavigate();
        const [{ isDirty }] = useBlock();
        const [disablePrompt, setDisablePrompt] = useState(false);

        const onClick = useCallback(
            showConfirmation => {
                if (isDirty) {
                    showConfirmation(() => {
                        setDisablePrompt(true);
                        navigate(-1);
                    });
                } else {
                    navigate(-1);
                }
            },
            [isDirty, setDisablePrompt, navigate]
        );

        return (
            <>
                <Prompt
                    when={isDirty && !disablePrompt}
                    message="There are some unsaved changes! Are you sure you want to navigate away and discard all changes?"
                />
                <ConfirmationDialog
                    title="There are some unsaved changes!"
                    message="Are you sure you want to navigate away and discard all changes?"
                >
                    {({ showConfirmation }) => (
                        <IconButton
                            data-testid="pb-editor-back-button"
                            className={backStyles}
                            onClick={() => onClick(showConfirmation)}
                            icon={<BackIcon />}
                        />
                    )}
                </ConfirmationDialog>
            </>
        );
    };
});
