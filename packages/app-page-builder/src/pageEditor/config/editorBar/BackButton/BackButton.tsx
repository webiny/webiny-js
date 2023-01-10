import React from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { usePageViewNavigation } from "~/hooks/usePageViewNavigation";
import { useRouter } from "@webiny/react-router/";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const { params } = useRouter();
        const { navigateToPageHome } = usePageViewNavigation();

        const id = params ? params["id"] : null;

        return (
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                // TODO: @leopuleo use navigateToLatestFolder() for the rollout of the new ACO
                onClick={() => navigateToPageHome(id)}
                icon={<BackIcon />}
            />
        );
    };
});
