import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as RefreshIcon } from "@webiny/app-headless-cms/admin/icons/baseline-autorenew-24px.svg";
import { css } from "emotion";

const buttonStyles = css({
    marginLeft: 10
});

const RefreshContentButton = props => {
    return (
        <IconButton
            data-testid={"cms-content-refresh-content-button"}
            className={buttonStyles}
            icon={<RefreshIcon />}
            onClick={() => props.refetchContent()}
        />
    );
};

export default RefreshContentButton;
