import React, { useCallback } from "react";
import { css } from "emotion";
import { createComponentPlugin } from "@webiny/app-admin";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const { navigate } = useRouter();

        const onClick = useCallback(() => {
            navigate(-1);
        }, [navigate]);

        return (
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                onClick={onClick}
                icon={<BackIcon />}
            />
        );
    };
});
