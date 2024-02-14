import React, { useCallback } from "react";
import { css } from "emotion";
import { createDecorator } from "@webiny/app-admin";
import { useLocation, useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { EditorBar } from "~/editor";
import { ReactComponent as BackIcon } from "./round-arrow_back-24px.svg";
import { useBlock } from "~/blockEditor/hooks/useBlock";

const backStyles = css({
    marginLeft: -10
});

export const BackButtonPlugin = createDecorator(EditorBar.BackButton, () => {
    return function BackButton() {
        const { key } = useLocation();
        const navigate = useNavigate();
        const [block] = useBlock();

        const onClick = useCallback(() => {
            // If location.key is "default", then we are in a new tab.
            if (key === "default") {
                navigate(`/page-builder/page-blocks?category=${block.blockCategory}`);
            } else {
                navigate(-1);
            }
        }, [key, navigate]);

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
