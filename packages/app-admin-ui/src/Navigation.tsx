import React from "react";
import { Provider } from "@webiny/app-admin";
import { SidebarProvider } from "./Navigation/SidebarProvider.js";
import { Navigation as DecoratedNavigation } from "./Navigation/Navigation.js";
import { DecoratedMenu } from "./Navigation/DecoratedMenu.js";

export const Navigation = () => {
    return (
        <>
            <Provider hoc={SidebarProvider} />
            <DecoratedNavigation />
            <DecoratedMenu />
        </>
    );
};
