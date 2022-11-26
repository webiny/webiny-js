import React from "react";
import { css } from "emotion";
import { createComponentPlugin } from "@webiny/app-admin";
import { useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const navigate = useNavigate();

        return (
            <ConfirmationDialog title="Are you sure?" message="All unsaved changes will be lost">
                {({ showConfirmation }) => (
                    <IconButton
                        data-testid="pb-editor-back-button"
                        className={backStyles}
                        onClick={() => showConfirmation(() => navigate(-1))}
                        icon={<BackIcon />}
                    />
                )}
            </ConfirmationDialog>
        );
    };
});
