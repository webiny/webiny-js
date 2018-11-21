import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { highlightElement, deactivateElement } from "webiny-app-cms/editor/actions";
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

export default compose(
    connect(
        null,
        { deactivateElement, highlightElement }
    ),
    withActiveElement()
)(Background);
