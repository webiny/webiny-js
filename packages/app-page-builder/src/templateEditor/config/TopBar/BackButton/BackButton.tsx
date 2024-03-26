import React, { useCallback } from "react";
import { css } from "emotion";
import { useNavigate } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";
import { TopBar } from "~/editor/config/TopBar/TopBar";

const backStyles = css({
    marginLeft: -10
});

export function BackButton() {
    const navigate = useNavigate();

    const onClick = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return (
        <>
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                onClick={onClick}
                icon={<BackIcon />}
            />
            <TopBar.Divider />
        </>
    );
}
