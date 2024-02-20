import React, { useCallback } from "react";
import { css } from "emotion";
import { createDecorator } from "@webiny/app-admin";
import { useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createDecorator(EditorBar.BackButton, () => {
    return function BackButton() {
        const navigate = useNavigate();

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
