import React, { memo } from "react";
import { Menus } from "./Base/Menus.js";
import { RoutesConfig } from "./Base/RoutesConfig.js";
import { Tenant } from "./Base/Tenant.js";
import { UserMenu } from "./Base/UserMenu.js";
import { LexicalPreset } from "./Base/LexicalPreset.js";
import { DefaultFieldRenderers } from "./Base/DefaultFieldRenderers.js";

const BaseExtension = () => {
    return (
        <>
            <Tenant />
            <Menus />
            <UserMenu />
            <RoutesConfig />
            <LexicalPreset />
            <DefaultFieldRenderers />
        </>
    );
};

export const Base = memo(BaseExtension);
