import React, { memo } from "react";
import { Menus } from "./Base/Menus.js";
import { RoutesConfig } from "./Base/RoutesConfig.js";
import { Tenant } from "./Base/Tenant.js";
import { UserMenu } from "./Base/UserMenu.js";
import { LexicalPreset } from "./Base/LexicalPreset.js";
import { CommandPaletteExtension } from "~/presentation/commandPalette/CommandPaletteExtension.js";

const BaseExtension = () => {
    return (
        <>
            <Tenant />
            <Menus />
            <UserMenu />
            <RoutesConfig />
            <LexicalPreset />
            <CommandPaletteExtension />
        </>
    );
};

export const Base = memo(BaseExtension);
