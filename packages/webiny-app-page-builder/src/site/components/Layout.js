// @flow
import * as React from "react";
import { withPageBuilder } from "webiny-app-page-builder/context";

const Layout = ({ pageBuilder: { theme }, layout, children }) => {
    const themeLayout = theme.layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children;
    }

    return React.createElement(themeLayout.component, null, children);
};

export default withPageBuilder()(Layout);
