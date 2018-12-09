// @flow
import React from "react";
import { compose, lifecycle } from "recompose";
import WebFont from "webfontloader";
import { CmsContextProvider } from "./CmsContext";

const CmsProvider = ({ theme, children }) => {
    return <CmsContextProvider theme={theme}>{children}</CmsContextProvider>;
};

export default compose(
    lifecycle({
        componentDidMount() {
            WebFont.load(this.props.theme.fonts);
        }
    })
)(CmsProvider);
