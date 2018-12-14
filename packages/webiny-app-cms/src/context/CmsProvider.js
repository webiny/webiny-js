// @flow
import React from "react";
import { compose, lifecycle } from "recompose";
import WebFont from "webfontloader";
import { CmsContextProvider } from "./CmsContext";
import type { CmsProviderPropsType } from "webiny-app-cms/types";

const CmsProvider = ({ children, ...rest }: CmsProviderPropsType) => {
    return <CmsContextProvider {...rest}>{children}</CmsContextProvider>;
};

export default compose(
    lifecycle({
        componentDidMount() {
            WebFont.load(this.props.theme.fonts);
        }
    })
)(CmsProvider);
