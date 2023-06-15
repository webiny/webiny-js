import React, { useCallback } from "react";
import { css } from "emotion";
import { createComponentPlugin } from "@webiny/app-admin";
import { useLocation, useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import { useBlock } from "~/blockEditor/hooks/useBlock";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createComponentPlugin(EditorBar.BackButton, () => {
    return function BackButton() {
        const location = useLocation();
        const navigate = useNavigate();
        const [block] = useBlock();

        const onClick = useCallback(() => {
            if (location.key === "default") {
                navigate(`/page-builder/page-blocks?category=${block.blockCategory}`);
            } else {
                navigate(-1);
            }
        }, [location, navigate]);

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
