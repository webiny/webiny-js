//@flow
import React from "react";
import useReactRouter from "use-react-router";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";

const backStyles = css({
    marginLeft: -10
});

const BackButton = () => {
    const { match, history } = useReactRouter();
    return (
        <IconButton
            className={backStyles}
            onClick={() => history.push(`/page-builder/pages?id=${match.params.id}`)}
            icon={<BackIcon />}
        />
    );
};

export default BackButton;
