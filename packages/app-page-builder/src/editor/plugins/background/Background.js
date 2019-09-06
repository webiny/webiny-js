// @flow
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { highlightElement, deactivateElement } from "@webiny/app-page-builder/editor/actions";
import { css } from "emotion";

const backgroundStyle = css({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    minHeight: "100%"
});

const Background = ({ element, deactivateElement, highlightElement }) => {
    return (
        <div
            className={backgroundStyle}
            onMouseOver={() => highlightElement({ element: null })}
            onClick={() => element && deactivateElement()}
        />
    );
};

export default connect(
    null,
    { deactivateElement, highlightElement }
)(withActiveElement()(Background));
