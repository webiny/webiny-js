import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useNavigate } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "~/assets/icons/round-arrow-back_24dp.svg";

const backStyles = css({
    marginLeft: -10
});

export const BackButton = React.memo(() => {
    const navigate = useNavigate();

    return (
        <IconButton
            data-testid="apw-content-review-editor-back-button"
            className={backStyles}
            onClick={() => navigate(`/apw/content-reviews`)}
            icon={<BackIcon />}
        />
    );
});

BackButton.displayName = "BackButton";
