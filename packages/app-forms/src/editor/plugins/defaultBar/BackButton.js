import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";
import useReactRouter from "use-react-router";

const backStyles = css({
    marginLeft: -10
});

const BackButton = React.memo(() => {
    const { match, history } = useReactRouter();

    return (
        <IconButton
            className={backStyles}
            onClick={() => history.push(`/forms?id=${match.params.id}`)}
            icon={<BackIcon />}
        />
    );
});

BackButton.displayName = "BackButton";

export default BackButton;
