// @flow
import React from "react";
import { compose, lifecycle } from "recompose";
import { CmsContextProvider } from "./CmsContext";
import type { CmsProviderPropsType } from "webiny-app-cms/types";

let WebFont;
if (process.env.REACT_APP_SSR !== "true") {
    WebFont = require("webfontloader");
}

const CmsProvider = ({ children, ...rest }: CmsProviderPropsType) => {
    return <CmsContextProvider {...rest}>{children}</CmsContextProvider>;
};

export default compose(
    lifecycle({
        componentDidMount() {
            if (process.env.REACT_APP_SSR !== "true") {
                WebFont.load(this.props.theme.fonts);
            }
        }
    })
)(CmsProvider);
