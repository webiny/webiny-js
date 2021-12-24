import React, { memo, Fragment } from "react";
import { Provider } from "./components/core/Provider";
import { SearchProvider } from "~/admin/components/ui/Search";
import { UserMenuProvider } from "~/admin/components/ui/UserMenu";
import { NavigationProvider } from "~/admin/components/ui/Navigation";
import { plugins } from "@webiny/plugins";
import adminPlugins from "../plugins";

const ShellExtension = () => {
    plugins.register(adminPlugins());

    return (
        <Fragment>
            <Provider hoc={SearchProvider} />
            <Provider hoc={UserMenuProvider} />
            <Provider hoc={NavigationProvider} />
        </Fragment>
    );
};

export const Shell = memo(ShellExtension);
