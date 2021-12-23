import React, { Fragment } from "react";
import { Provider } from "./components/core/Provider";
import { SearchProvider } from "~/admin/components/ui/Search";
import { UserMenuProvider } from "~/admin/components/ui/UserMenu";
import { NavigationProvider } from "~/admin/components/ui/Navigation";

export const Shell = () => {
    return (
        <Fragment>
            <Provider hoc={SearchProvider} />
            <Provider hoc={UserMenuProvider} />
            <Provider hoc={NavigationProvider} />
        </Fragment>
    );
};
