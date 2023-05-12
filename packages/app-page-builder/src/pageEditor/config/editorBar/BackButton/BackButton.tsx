import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const { navigateToLatestFolder } = usePageViewNavigation();

        return (
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                onClick={navigateToLatestFolder}
                icon={<BackIcon />}
            />
        );
    };
});
