import React, { memo } from "react";
import { Menus } from "./Base/Menus.js";
import { RoutesConfig } from "./Base/RoutesConfig.js";
import { Tenant } from "./Base/Tenant.js";
import { AdminConfigProvider } from "~/config/AdminConfig.js";
import { UserMenu } from "./Base/UserMenu.js";
import { BaseLexicalTheme } from "./Base/BaseLexicalTheme.js";

const BaseExtension = () => {
    return (
        <>
            <AdminConfigProvider />
            <Tenant />
            <Menus />
            <UserMenu />
            <RoutesConfig />
            <BaseLexicalTheme />
        </>
    );
};

export const Base = memo(BaseExtension);
