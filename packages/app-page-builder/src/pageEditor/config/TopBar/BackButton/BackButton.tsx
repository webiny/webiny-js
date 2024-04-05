import React from "react";
import { ReactComponent as BackIcon } from "@material-design-icons/svg/round/arrow_back.svg";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { TopBar } from "~/editor/config/TopBar/TopBar";

const backStyles = css({
    marginLeft: -10
});

export const BackButton = () => {
    const navigate = useNavigatePage();

    return (
        <>
            <IconButton
                data-testid="pb-editor-back-button"
                className={backStyles}
                onClick={navigate.navigateToLatestFolder}
                icon={<BackIcon />}
            />
            <TopBar.Divider />
        </>
    );
};
