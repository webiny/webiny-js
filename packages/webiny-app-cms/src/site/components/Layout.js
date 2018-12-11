// @flow
import * as React from "react";
import { withCms } from "webiny-app-cms/context";

const Layout = ({ cms: { theme }, layout, children }) => {
    const themeLayout = theme.layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children;
    }

    return React.createElement(themeLayout.component, null, children);
};

export default withCms()(Layout);
