import React from "react";
import { css } from "emotion";
import { IconButton } from "@webiny/ui/Button";
import { useRouter } from "@webiny/react-router";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";

const backStyles = css({
    marginLeft: -10
});

const BackButton = React.memo(() => {
    const { history } = useRouter();

    return (
        <IconButton
            data-testid="cms-editor-back-button"
            className={backStyles}
            onClick={() => history.push(`/cms/content-models`)}
            icon={<BackIcon />}
        />
    );
});

BackButton.displayName = "BackButton";

export default BackButton;
