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
            className={buttonStyles}
            icon={<RefreshIcon />}
            onClick={() => props.refetchContent()}
        />
    );
};

export default RefreshContentButton;
