import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";
import { withRouter } from "react-router-dom";

const backStyles = css({
    marginLeft: -10
});

const BackButton = (props) => {
    const { match, history } = props;

    return (
        <IconButton
            className={backStyles}
            onClick={() => history.push(`/forms?id=${match.params.id}`)}
            icon={<BackIcon />}
        />
    );
};

export default withRouter(BackButton);
