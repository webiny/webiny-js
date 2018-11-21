//@flow
import React from "react";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as BackIcon } from "./icons/round-arrow_back-24px.svg";
import { css } from "emotion";

const backStyles = css({
    marginLeft: -10
});

const BackButton = ({ router }: WithRouterProps) => {
    const pagesList = {
        id: router.getParams("id")
    };

    return (
        <IconButton
            className={backStyles}
            onClick={() => router.goToRoute({ name: "Cms.Pages", params: pagesList })}
            icon={<BackIcon />}
        />
    );
};

export default withRouter()(BackButton);
