//@flow
import React from "react";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as BackIcon } from "webiny-app-cms/editor/assets/icons/round-arrow_back-24px.svg";
import { css } from "emotion";

const backStyles = css({
    marginLeft: -10
});

const BackButton = () => {
    return (
        <IconButton
            className={backStyles}
            onClick={() => window.history.back()}
            icon={<BackIcon />}
        />
    );
};

export default BackButton;
