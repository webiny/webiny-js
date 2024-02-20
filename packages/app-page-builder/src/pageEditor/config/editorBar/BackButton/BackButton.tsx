import React from "react";
import { createDecorator } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createDecorator(EditorBar.BackButton, () => {
    return function BackButton() {
        const navigate = useNavigatePage();

        return (
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                onClick={navigate.navigateToLatestFolder}
                icon={<BackIcon />}
            />
        );
    };
});
