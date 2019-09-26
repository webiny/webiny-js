// @flow
import * as React from "react";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";

const Layout = ({ layout, children }) => {
    const { theme } = usePageBuilder();
    const themeLayout = theme.layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children;
    }

    return React.createElement(themeLayout.component, null, children);
};

export default Layout;
